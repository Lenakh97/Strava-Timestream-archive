import { SESClient } from '@aws-sdk/client-ses'
import { fromEnv } from '@nordicsemiconductor/from-env'
import { createSendEmailCommand } from './createSendEmailCommand.js'
import { getRandomWeeklyWinners } from './getRandomWeeklyWinners.js'
import { JsonToEmailFormat, WinnersObject } from './JsonToEmailFormat.js'
import { weekNumber } from '../weekNumber.js'
import { teamList } from '../teamList.js'
import { sendEmail } from '../../config.js'

const ses = new SESClient({})
const { tableInfo } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

export const handler = async (): Promise<any> => {
	const currentTime = new Date()
	const randomWinners = await getRandomWeeklyWinners({
		DatabaseName: dbName,
		TableName: tableName,
		weekNumber: weekNumber(currentTime),
	})
	const winners = JSON.stringify(randomWinners, null, 2)
	const parsed = JSON.parse(winners) as WinnersObject
	const content = JsonToEmailFormat(parsed, teamList)
	const sendEmailCommand = createSendEmailCommand(
		sendEmail.toAddress,
		sendEmail.fromAddress,
		content,
		`Random winners week ${weekNumber(currentTime)}`,
	)

	try {
		return await ses.send(sendEmailCommand)
	} catch (e) {
		console.error('Failed to send email.', e)
		return e
	}
}
