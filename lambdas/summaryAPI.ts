import {
	DynamoDBClient,
	QueryCommand,
	QueryCommandOutput,
} from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { fromEnv } from '@nordicsemiconductor/from-env'
import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export type StravaSummaryObject = {
	distanceGoal: number
	currentDistance: number
}

const { cacheTableName } = fromEnv({
	cacheTableName: 'CACHE_TABLE_NAME',
})(process.env)

const db = new DynamoDBClient({})

const headers = {
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Allow-Origin': '*', // Allow from anywhere
	'Access-Control-Allow-Methods': 'GET', // Allow only GET request
}

const summaryPromises: Record<string, Promise<QueryCommandOutput>> = {}

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
	// Cache results for 10 minutes
	const key = new Date().toISOString().slice(0, 15) // 2022-12-14T11:1
	if (summaryPromises[key] === undefined)
		summaryPromises[key] = db.send(
			new QueryCommand({
				TableName: cacheTableName,
				KeyConditionExpression: 'cacheKey = :cacheKey',
				ExpressionAttributeValues: {
					[':cacheKey']: {
						S: 'strava-summary',
					},
				},
				ProjectionExpression: 'summary',
				ScanIndexForward: false,
				Limit: 1,
			}),
		)

	const res = await (summaryPromises[key] as Promise<QueryCommandOutput>)

	if (res.Items?.[0] === undefined) {
		return {
			statusCode: 404,
			headers,
		}
	}
	return {
		statusCode: 200,
		body: JSON.stringify(unmarshall(res.Items[0]).summary, null, 2),
		headers,
	}
}
