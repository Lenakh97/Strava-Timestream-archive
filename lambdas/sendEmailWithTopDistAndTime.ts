import { SESClient } from '@aws-sdk/client-ses'
import { fromEnv } from '@nordicsemiconductor/from-env'
import { createSendEmailCommand } from '../createSendEmailCommand.js'
import { getTopDistanceAndTimeAthlete } from '../getTopDistanceAndTimeAthlete.js'
import { JsonToEmailFormat } from '../JsonToEmailFormat.js'
import { teamList } from './teamList.js'

const ses = new SESClient({})
const { tableInfo } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

export const handler = async (): Promise<any> => {
	const topDistAndTimeAthletes = await getTopDistanceAndTimeAthlete({
		DatabaseName: dbName,
		TableName: tableName,
	})
	const winners = JSON.stringify(topDistAndTimeAthletes)
	const parsed = JSON.parse(winners)
	const content = JsonToEmailFormat(parsed, teamList)
	const sendEmailCommand = createSendEmailCommand(
		'lena.haraldseid@nordicsemi.no',
		'lena.haraldseid@nordicsemi.no',
		content,
		`Time and Distance Statistics`,
	)

	try {
		return await ses.send(sendEmailCommand)
	} catch (e) {
		console.error('Failed to send email.')
		return e
	}
}
