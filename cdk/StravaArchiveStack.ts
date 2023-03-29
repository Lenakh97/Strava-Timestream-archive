import CloudFormation, {
	aws_events as Events,
	aws_events_targets as EventsTargets,
	aws_iam as IAM,
	aws_s3 as S3,
	aws_sns as SNS,
	aws_ssm as SSM,
} from 'aws-cdk-lib'
import type { IPrincipal } from 'aws-cdk-lib/aws-iam'
import Lambda from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import Timestream from 'aws-cdk-lib/aws-timestream'
import type { StravaArchiveLambdas } from './lambdas'

export class StravaArchiveStack extends CloudFormation.Stack {
	public constructor(
		parent: CloudFormation.App,
		{
			lambdas,
		}: {
			lambdas: StravaArchiveLambdas
		},
	) {
		super(parent, 'strava-archive')

		// Timestream database
		const db = new Timestream.CfnDatabase(this, 'db')
		const table = new Timestream.CfnTable(this, 'table', {
			databaseName: db.ref,
			retentionProperties: {
				MemoryStoreRetentionPeriodInHours: '24',
				MagneticStoreRetentionPeriodInDays: '365',
			},
		})
		const teamCountTable = new Timestream.CfnTable(this, 'teamCountTable', {
			databaseName: db.ref,
			retentionProperties: {
				MemoryStoreRetentionPeriodInHours: '24',
				MagneticStoreRetentionPeriodInDays: '7',
			},
		})

		const timestreamErrorBucket = new S3.Bucket(this, 'timestreamErrorBucket')
		const timestreamSNSTopic = new SNS.Topic(this, 'timestreamSNSTopic')

		const timestreamPolicy = new IAM.Policy(this, 'timestreamPolicy')
		const timestreamRole = new IAM.Role(this, 'timestreamRole', {
			assumedBy: new IAM.ServicePrincipal('timestream.amazonaws.com'),
		})
		timestreamRole.attachInlinePolicy(timestreamPolicy)
		timestreamPolicy.addStatements(
			new IAM.PolicyStatement({
				actions: [
					'timestream:Select',
					'timestream:DescribeTable',
					'timestream:ListMeasures',
				],
				resources: [table.attrArn],
			}),
		)
		timestreamPolicy.addStatements(
			new IAM.PolicyStatement({
				actions: [
					'timestream:DescribeEndpoints',
					'timestream:SelectValues',
					'timestream:CancelQuery',
				],
				resources: ['*'],
			}),
		)
		timestreamPolicy.addStatements(
			new IAM.PolicyStatement({
				actions: ['timestream:WriteRecords'],
				resources: [teamCountTable.attrArn],
			}),
		)
		timestreamErrorBucket.grantWrite(timestreamRole)
		timestreamPolicy.addStatements(
			new IAM.PolicyStatement({
				actions: ['s3:GetBucketAcl'],
				resources: [timestreamErrorBucket.bucketArn],
			}),
		)
		timestreamSNSTopic.grantPublish(timestreamPolicy)

		const teamMemberCountQuery = new Timestream.CfnScheduledQuery(
			this,
			'teamMemberCountQuery',
			{
				queryString: `SELECT Team as teamId, COUNT (DISTINCT athlete) as memberCount, bin(now(), 1d) as day FROM "${db.ref}"."${table.attrName}" GROUP BY Team`,
				errorReportConfiguration: {
					s3Configuration: {
						bucketName: timestreamErrorBucket.bucketName,
					},
				},
				notificationConfiguration: {
					snsConfiguration: {
						topicArn: timestreamSNSTopic.topicArn,
					},
				},
				scheduleConfiguration: {
					scheduleExpression: 'rate(1 day)',
				},
				scheduledQueryExecutionRoleArn: timestreamRole.roleArn,
				targetConfiguration: {
					timestreamConfiguration: {
						databaseName: db.ref,
						tableName: teamCountTable.attrName,
						timeColumn: 'day',
						dimensionMappings: [
							{
								name: 'teamId',
								dimensionValueType: 'VARCHAR',
							},
						],
						multiMeasureMappings: {
							targetMultiMeasureName: 'memberCount',
							multiMeasureAttributeMappings: [
								{
									sourceColumn: 'memberCount',
									measureValueType: 'BIGINT',
								},
							],
						},
					},
				},
			},
		)

		teamMemberCountQuery.node.addDependency(timestreamPolicy)
		teamMemberCountQuery.addDependency(teamCountTable)
		teamMemberCountQuery.node.addDependency(timestreamSNSTopic)
		teamMemberCountQuery.node.addDependency(timestreamErrorBucket)

		new CloudFormation.CfnOutput(this, 'tableInfo', {
			value: table.ref,
			exportName: 'tableInfo',
		})

		new CloudFormation.CfnOutput(this, 'tableArn', {
			value: table.attrArn,
			exportName: 'tableArn',
		})

		// Layer with dependencies for the lambdas
		const layer = new Lambda.LayerVersion(this, `layer`, {
			code: Lambda.Code.fromAsset(lambdas.layerZipFileName),
			compatibleRuntimes: [Lambda.Runtime.NODEJS_18_X],
		})

		// Lambda that fetches activities and stores them in the DB
		const storeMessagesInTimestream = new Lambda.Function(
			this,
			'storeMessagesInTimestream',
			{
				layers: [layer],
				handler: lambdas.lambdas.storeActivities.handler,
				architecture: Lambda.Architecture.ARM_64,
				runtime: Lambda.Runtime.NODEJS_18_X,
				timeout: CloudFormation.Duration.minutes(2),
				memorySize: 1792,
				code: Lambda.Code.fromAsset(lambdas.lambdas.storeActivities.zipFile),
				description:
					'Fetches activities from Strava and stores them in Timestream',
				environment: {
					TABLE_INFO: table.ref,
					CLIENT_ID: SSM.StringParameter.valueForStringParameter(
						this,
						'/strava/clientId',
					),
					CLIENT_SECRET: SSM.StringParameter.valueForStringParameter(
						this,
						'/strava/clientSecret',
					),
					REFRESH_TOKEN: SSM.StringParameter.valueForStringParameter(
						this,
						'/strava/refreshToken',
					),
				},
				initialPolicy: [
					new IAM.PolicyStatement({
						actions: ['timestream:WriteRecords'],
						resources: [table.attrArn],
					}),
					new IAM.PolicyStatement({
						actions: ['timestream:DescribeEndpoints'],
						resources: ['*'],
					}),
					new IAM.PolicyStatement({
						actions: ['ssm:GetParameter', 'ssm:PutParameter'],
						resources: ['arn:aws:ssm:*:*:parameter/strava/*'],
					}),
				],
				logRetention: RetentionDays.ONE_WEEK,
			},
		)

		// Execute the lambda every hour
		const rule = new Events.Rule(this, 'InvokeActivitiesRule', {
			schedule: Events.Schedule.expression('rate(1 hour)'),
			description: `Invoke the lambda that fetches activities from Strava`,
			enabled: true,
			targets: [new EventsTargets.LambdaFunction(storeMessagesInTimestream)],
		})

		storeMessagesInTimestream.addPermission('InvokeByEvents', {
			principal: new IAM.ServicePrincipal('events.amazonaws.com') as IPrincipal,
			sourceArn: rule.ruleArn,
		})

		// Lambda that prepares reports from and provides them via a REST API
		const summaryAPI = new Lambda.Function(this, 'summaryAPI', {
			layers: [layer],
			handler: lambdas.lambdas.summaryAPI.handler,
			architecture: Lambda.Architecture.ARM_64,
			runtime: Lambda.Runtime.NODEJS_18_X,
			timeout: CloudFormation.Duration.minutes(1),
			memorySize: 1792,
			code: Lambda.Code.fromAsset(lambdas.lambdas.summaryAPI.zipFile),
			description: 'Prepare reports from and provide them via a REST API',
			environment: {
				TABLE_INFO: table.ref,
				TEAM_COUNT_TABLE: teamCountTable.attrName,
			},
			initialPolicy: [
				new IAM.PolicyStatement({
					actions: [
						'timestream:Select',
						'timestream:DescribeTable',
						'timestream:ListMeasures',
					],
					resources: [table.attrArn, teamCountTable.attrArn],
				}),
				new IAM.PolicyStatement({
					actions: [
						'timestream:DescribeEndpoints',
						'timestream:SelectValues',
						'timestream:CancelQuery',
					],
					resources: ['*'],
				}),
			],
			logRetention: RetentionDays.ONE_WEEK,
		})

		const url = summaryAPI.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})

		new CloudFormation.CfnOutput(this, 'summaryAPIURL', {
			value: url.url,
			exportName: 'summaryAPIURL',
		})
	}
}
