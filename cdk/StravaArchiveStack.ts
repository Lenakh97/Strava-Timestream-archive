import CloudFormation, {
	aws_dynamodb as DynamoDB,
	aws_events as Events,
	aws_events_targets as EventsTargets,
	aws_iam as IAM,
	aws_ssm as SSM,
} from 'aws-cdk-lib'
import type { IPrincipal } from 'aws-cdk-lib/aws-iam'
import Lambda from 'aws-cdk-lib/aws-lambda'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import Timestream from 'aws-cdk-lib/aws-timestream'
import type { StravaArchiveLambdas } from './lambdas.ts'
//import { TeamCountScheduledQuery } from './TeamCountScheduledQuery.js'
import { CD } from './CD.js'
import { STACK_NAME } from './stackConfig.js'

export class StravaArchiveStack extends CloudFormation.Stack {
	public constructor(
		parent: CloudFormation.App,
		{
			lambdas,
			repository,
			gitHubOIDCProviderArn,
		}: {
			lambdas: StravaArchiveLambdas
			repository: {
				owner: string
				repo: string
			}
			gitHubOIDCProviderArn: string
		},
	) {
		super(parent, STACK_NAME)

		// Set up role for CD
		const gitHubOIDC = IAM.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
			this,
			'gitHubOICDProvider',
			gitHubOIDCProviderArn,
		)
		const cd = new CD(this, { repository, gitHubOIDC })

		new CloudFormation.CfnOutput(this, 'cdRoleArn', {
			exportName: `${this.stackName}:cdRoleArn`,
			description: 'Role to use in GitHub Actions',
			value: cd.role.roleArn,
		})

		// Timestream database
		const db = new Timestream.CfnDatabase(this, 'db')
		const table = new Timestream.CfnTable(this, 'table', {
			databaseName: db.ref,
			retentionProperties: {
				MemoryStoreRetentionPeriodInHours: '24',
				MagneticStoreRetentionPeriodInDays: '365',
			},
		})

		//const teamCount = new TeamCountScheduledQuery(this, db, table)

		new CloudFormation.CfnOutput(this, 'tableInfo', {
			value: table.ref,
			exportName: `${this.stackName}:tableInfo`,
		})

		new CloudFormation.CfnOutput(this, 'tableArn', {
			value: table.attrArn,
			exportName: `${this.stackName}:tableArn`,
		})

		// Summary cache table
		const summaryCacheTable = new DynamoDB.Table(this, 'summaryCacheDB', {
			billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
			partitionKey: {
				name: 'cacheKey',
				type: DynamoDB.AttributeType.STRING,
			},
			sortKey: {
				name: 'timestamp',
				type: DynamoDB.AttributeType.STRING,
			},
			removalPolicy: CloudFormation.RemovalPolicy.DESTROY,
			timeToLiveAttribute: 'ttl',
		})

		// Layer with dependencies for the lambdas
		const layer = new Lambda.LayerVersion(this, `layer`, {
			code: Lambda.Code.fromAsset(lambdas.layerZipFileName),
			compatibleRuntimes: [Lambda.Runtime.NODEJS_18_X],
		})

		// Lambda that fetches activities and stores them in the DB, then writes the summary
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
					'Fetches activities from Strava and stores them in Timestream, then writes the summary',
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
					CACHE_TABLE_NAME: summaryCacheTable.tableName,
				},
				initialPolicy: [
					new IAM.PolicyStatement({
						actions: ['timestream:WriteRecords'],
						resources: [table.attrArn],
					}),
					new IAM.PolicyStatement({
						actions: [
							'timestream:DescribeEndpoints',
							'timestream:SelectValues',
							'timestream:CancelQuery',
						],
						resources: ['*'],
					}),
					new IAM.PolicyStatement({
						actions: ['ssm:GetParameter', 'ssm:PutParameter'],
						resources: ['arn:aws:ssm:*:*:parameter/strava/*'],
					}),
					new IAM.PolicyStatement({
						actions: [
							'timestream:Select',
							'timestream:DescribeTable',
							'timestream:ListMeasures',
						],
						resources: [table.attrArn],
					}),
				],
				logRetention: RetentionDays.ONE_WEEK,
			},
		)
		summaryCacheTable.grantFullAccess(storeMessagesInTimestream)

		//Lambda function for sending email with total distance and time
		const sendEmailWithTopDistAndTime = new Lambda.Function(
			this,
			'sendEmailWithTopDistAndTime',
			{
				layers: [layer],
				handler: lambdas.lambdas.sendEmailWithTopDistAndTime.handler,
				architecture: Lambda.Architecture.ARM_64,
				runtime: Lambda.Runtime.NODEJS_18_X,
				timeout: CloudFormation.Duration.minutes(10),
				memorySize: 1792,
				code: Lambda.Code.fromAsset(
					lambdas.lambdas.sendEmailWithTopDistAndTime.zipFile,
				),
				description: 'Send Email with winners',
				initialPolicy: [
					new IAM.PolicyStatement({
						actions: ['ses:SendEmail', 'ses:SendRawEmail'],
						resources: ['*'],
					}),
					new IAM.PolicyStatement({
						actions: ['timestream:DescribeEndpoints', 'timestream:Select'],
						resources: ['*'],
					}),
				],
				environment: {
					TABLE_INFO: table.ref,
				},
				logRetention: RetentionDays.ONE_WEEK,
			},
		)

		//Lambda function for sending email with random weekly winners
		const sendEmailWithRandomWinners = new Lambda.Function(
			this,
			'sendEmailWithRandomWinners',
			{
				layers: [layer],
				handler: lambdas.lambdas.sendEmailWithRandomWinners.handler,
				architecture: Lambda.Architecture.ARM_64,
				runtime: Lambda.Runtime.NODEJS_18_X,
				timeout: CloudFormation.Duration.minutes(10),
				memorySize: 1792,
				code: Lambda.Code.fromAsset(
					lambdas.lambdas.sendEmailWithRandomWinners.zipFile,
				),
				description: 'Send Email with winners',
				initialPolicy: [
					new IAM.PolicyStatement({
						actions: ['ses:SendEmail', 'ses:SendRawEmail'],
						resources: ['*'],
					}),
					new IAM.PolicyStatement({
						actions: ['timestream:DescribeEndpoints', 'timestream:Select'],
						resources: ['*'],
					}),
				],
				environment: {
					TABLE_INFO: table.ref,
				},
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
		const weeklyRule = new Events.Rule(this, 'SendEmailRule', {
			schedule: Events.Schedule.cron({
				minute: '0',
				hour: '23',
				weekDay: 'SUN',
			}),
			description: `Invoke the lambda that sends email with winners`,
			enabled: true,
			targets: [
				new EventsTargets.LambdaFunction(sendEmailWithTopDistAndTime),
				new EventsTargets.LambdaFunction(sendEmailWithRandomWinners),
			],
		})

		storeMessagesInTimestream.addPermission('InvokeByEvents', {
			principal: new IAM.ServicePrincipal('events.amazonaws.com') as IPrincipal,
			sourceArn: rule.ruleArn,
		})
		sendEmailWithTopDistAndTime.addPermission('InvokeByEvents', {
			principal: new IAM.ServicePrincipal('events.amazonaws.com') as IPrincipal,
			sourceArn: weeklyRule.ruleArn,
		})
		sendEmailWithRandomWinners.addPermission('InvokeByEvents', {
			principal: new IAM.ServicePrincipal('events.amazonaws.com') as IPrincipal,
			sourceArn: weeklyRule.ruleArn,
		})
		// Lambda that prepares reports from and provides them via a REST API
		const summaryAPI = new Lambda.Function(this, 'summaryAPI', {
			layers: [layer],
			handler: lambdas.lambdas.summaryAPI.handler,
			architecture: Lambda.Architecture.ARM_64,
			runtime: Lambda.Runtime.NODEJS_18_X,
			timeout: CloudFormation.Duration.seconds(1),
			memorySize: 1792,
			code: Lambda.Code.fromAsset(lambdas.lambdas.summaryAPI.zipFile),
			description: 'Return reports via a REST API',
			environment: {
				CACHE_TABLE_NAME: summaryCacheTable.tableName,
			},
			logRetention: RetentionDays.ONE_WEEK,
		})
		summaryCacheTable.grantReadData(summaryAPI)

		const url = summaryAPI.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})

		new CloudFormation.CfnOutput(this, 'summaryAPIURL', {
			value: url.url,
			exportName: `${this.stackName}:summaryAPIURL`,
		})
	}
}
export type StackOutputs = {
	cdRoleArn: string
}
