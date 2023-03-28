import {
	GetParameterCommand,
	ParameterType,
	PutParameterCommand,
	SSMClient,
} from '@aws-sdk/client-ssm'
import {
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { fromEnv } from '@nordicsemiconductor/from-env'
import { getAccessToken } from '../stravaAPI/getAccessToken.js'
import { getActivities } from '../stravaAPI/getActivities.js'
import { stravaToTimestream } from '../stravaToTimestream.js'
import { teamList } from './teamList.js'

const { tableInfo, clientID, clientSecret, refreshToken } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
	clientID: 'CLIENT_ID',
	clientSecret: 'CLIENT_SECRET',
	refreshToken: 'REFRESH_TOKEN',
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

const ssm = new SSMClient({})
const tsw = new TimestreamWriteClient({})

export const handler = async (): Promise<void> => {
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

	for (const { id: team } of teamList) {
		const data = await getActivities({
			accessToken,
			team,
			startTimestamp: Math.round(
				new Date(startTimestamp ?? fallBackStartTimestamp).getTime() / 1000,
			),
		})
		console.log(JSON.stringify({ data }))
		const record = stravaToTimestream(team, new Date(), data)
		const records = []
		if (record.length > 100) {
			let j = 0
			for (let i = 99; j < record.length; i += 100) {
				records.push(record.slice(j, i))
				j = i
			}
		} else {
			records.push(record)
		}
		for (const rec of records) {
			if (rec.length == 0) {
				console.log('Empty record')
				continue
			} else {
				try {
					await tsw.send(
						new WriteRecordsCommand({
							DatabaseName: dbName,
							TableName: tableName,
							Records: rec,
						}),
					)
					console.log(JSON.stringify({ written: rec }, null, 2))
				} catch (error) {
					console.error('Error:', error)
				}
			}
		}
	}
	await ssm.send(
		new PutParameterCommand({
			Name: '/strava/lastFetchTime',
			Type: ParameterType.STRING,
			Value: new Date().toISOString(),
			Overwrite: true,
		}),
	)
}
