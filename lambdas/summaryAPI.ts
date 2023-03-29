import { TimestreamQueryClient } from '@aws-sdk/client-timestream-query'
import { fromEnv } from '@nordicsemiconductor/from-env'
import type { APIGatewayProxyResultV2 } from 'aws-lambda'
import { getMemberCount } from '../getMemberCount.js'
import { getMemberCountScheduled } from '../getMemberCountScheduled.js'
import { getSummary } from '../getSummary.js'
import { teamList } from './teamList.js'

export type StravaSummaryObject = {
	distanceGoal: number
	currentDistance: number
}

const { tableInfo, teamCountTable } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
	teamCountTable: 'TEAM_COUNT_TABLE', // teamCountTable-OxGhPh8LwBoF
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]
const tsq = new TimestreamQueryClient({})

// Cache the member count in the execution context
const memberCountPromise = (async () => {
	const memberCountFromScheduledQuery = await getMemberCountScheduled({
		tsq,
		db: dbName,
		table: teamCountTable,
	})
	if (Object.keys(memberCountFromScheduledQuery).length > 0)
		return memberCountFromScheduledQuery

	return getMemberCount({
		DatabaseName: dbName,
		TableName: tableName,
	})
})()

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
	const StravaChallengeWeeks = [13, 14, 15, 16, 17]

	const memberCount = await memberCountPromise

	const summary = await getSummary({
		DatabaseName: dbName,
		TableName: tableName,
		teamInfo: teamList,
		StravaChallengeWeeks: StravaChallengeWeeks,
		memberCount,
	})
	return {
		statusCode: 200,
		body: JSON.stringify(summary, null, 2),
		headers: {
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Origin': '*', // Allow from anywhere
			'Access-Control-Allow-Methods': 'GET', // Allow only GET request
		},
	}
}
