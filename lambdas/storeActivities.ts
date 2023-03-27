import {
	GetParameterCommand,
	ParameterType,
	PutParameterCommand,
	SSMClient,
} from '@aws-sdk/client-ssm'
import { fromEnv } from '@nordicsemiconductor/from-env'
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
} from 'aws-lambda'
import { getAccessToken } from '../stravaAPI/getAccessToken.js'
import { getActivities } from '../stravaAPI/getActivities.js'

const { tableInfo, clientID, clientSecret, refreshToken } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
	clientID: 'CLIENT_ID',
	clientSecret: 'CLIENT_SECRET',
	refreshToken: 'REFRESH_TOKEN',
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

const ssm = new SSMClient({})

const teamList = [
	838205, 982093, 838211, 838207, 838209, 838203, 232813, 838200,
]

export const handler = async (
	event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
	console.log(JSON.stringify(event))
	console.log({
		clientID,
		clientSecret,
		refreshToken,
		dbName,
		tableName,
	})
	const accessToken = await getAccessToken({
		CLIENT_ID: clientID,
		CLIENT_SECRET: clientSecret,
		REFRESH_TOKEN: refreshToken,
	})

	const fallBackStartTimestamp = new Date('2023-03-27T00:00:00').toISOString()
	let startTimestamp: string | undefined
	try {
		startTimestamp = (
			await ssm.send(
				new GetParameterCommand({
					Name: '/strava/lastFetchTime',
				}),
			)
		)?.Parameter?.Value
	} catch {
		startTimestamp = fallBackStartTimestamp
	}

	for (const team of teamList) {
		const data = await getActivities({
			accessToken,
			team,
			startTimestamp: Math.round(
				new Date(startTimestamp ?? fallBackStartTimestamp).getTime() / 1000,
			),
		})
		console.log(JSON.stringify({ data }))
	}

	await ssm.send(
		new PutParameterCommand({
			Name: '/strava/lastFetchTime',
			Type: ParameterType.STRING,
			Value: new Date().toISOString(),
		}),
	)

	return {
		statusCode: 501,
	}
}
