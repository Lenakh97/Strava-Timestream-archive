import { aws_iam as IAM, aws_s3 as S3, aws_sns as SNS } from 'aws-cdk-lib'
import Timestream from 'aws-cdk-lib/aws-timestream'
import { Construct } from 'constructs'

export class TeamCountScheduledQuery extends Construct {
	public readonly table: Timestream.CfnTable
	constructor(
		parent: Construct,
		db: Timestream.CfnDatabase,
		stravaDataTable: Timestream.CfnTable,
	) {
		super(parent, 'TeamCountScheduledQuery')

		this.table = new Timestream.CfnTable(this, 'teamCountTable', {
			databaseName: db.ref,
			retentionProperties: {
				MemoryStoreRetentionPeriodInHours: '24',
				MagneticStoreRetentionPeriodInDays: '7',
			},
		})

		const errorBucket = new S3.Bucket(this, 'errorBucket')
		const snsTopic = new SNS.Topic(this, 'snsTopic')

		const policy = new IAM.Policy(this, 'policy')
		const role = new IAM.Role(this, 'role', {
			assumedBy: new IAM.ServicePrincipal('timestream.amazonaws.com'),
		})
		role.attachInlinePolicy(policy)
		policy.addStatements(
			new IAM.PolicyStatement({
				actions: [
					'timestream:Select',
					'timestream:DescribeTable',
					'timestream:ListMeasures',
				],
				resources: [stravaDataTable.attrArn],
			}),
		)
		policy.addStatements(
			new IAM.PolicyStatement({
				actions: [
					'timestream:DescribeEndpoints',
					'timestream:SelectValues',
					'timestream:CancelQuery',
				],
				resources: ['*'],
			}),
		)
		policy.addStatements(
			new IAM.PolicyStatement({
				actions: ['timestream:WriteRecords'],
				resources: [this.table.attrArn],
			}),
		)
		errorBucket.grantWrite(role)
		policy.addStatements(
			new IAM.PolicyStatement({
				actions: ['s3:GetBucketAcl'],
				resources: [errorBucket.bucketArn],
			}),
		)
		snsTopic.grantPublish(policy)

		const teamMemberCountQuery = new Timestream.CfnScheduledQuery(
			this,
			'teamMemberCountQuery',
			{
				queryString: `SELECT Team as teamId, COUNT (DISTINCT athlete) as memberCount, bin(now(), 1d) as day FROM "${db.ref}"."${stravaDataTable.attrName}" GROUP BY Team`,
				errorReportConfiguration: {
					s3Configuration: {
						bucketName: errorBucket.bucketName,
					},
				},
				notificationConfiguration: {
					snsConfiguration: {
						topicArn: snsTopic.topicArn,
					},
				},
				scheduleConfiguration: {
					scheduleExpression: 'rate(1 day)',
				},
				scheduledQueryExecutionRoleArn: role.roleArn,
				targetConfiguration: {
					timestreamConfiguration: {
						databaseName: db.ref,
						tableName: this.table.attrName,
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

		teamMemberCountQuery.node.addDependency(policy)
		teamMemberCountQuery.addDependency(this.table)
		teamMemberCountQuery.node.addDependency(snsTopic)
		teamMemberCountQuery.node.addDependency(errorBucket)
	}
}
