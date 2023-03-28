import { fromEnv } from '@nordicsemiconductor/from-env'
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
} from 'aws-lambda'
import { getSummary } from '../getSummary.js'
import { teamList } from './teamList.js'

export type StravaSummaryObject = {
	distanceGoal: number
	currentDistance: number
}

const { tableInfo } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

export const handler = async (
	event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
	console.log(JSON.stringify(event))
	const StravaChallengeWeeks = [13, 14, 15, 16, 17]

	const summary = await getSummary({
		DatabaseName: dbName,
		TableName: tableName,
		teamInfo: teamList,
		StravaChallengeWeeks: StravaChallengeWeeks,
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
