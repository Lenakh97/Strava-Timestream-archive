import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { fromEnv } from '@nordicsemiconductor/from-env'
import { getTopDistanceAndTimeAthlete } from '../getTopDistanceAndTimeAthlete.js'
import { weekNumber } from '../weekNumber.js'

const ses = new SESClient({})
const { tableInfo } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

const createSendEmailCommand = (
	toAddress: string,
	fromAddress: string,
	weekNumber: number,
	content: string,
) => {
	return new SendEmailCommand({
		Destination: {
			/* required */
			CcAddresses: [
				/* more items */
			],
			ToAddresses: [
				toAddress,
				/* more To-email addresses */
			],
		},
		Message: {
			/* required */
			Body: {
				/* required */
				Html: {
					Charset: 'UTF-8',
					Data: JSON.stringify(content),
				},
				Text: {
					Charset: 'UTF-8',
					Data: JSON.stringify(content),
				},
			},
			Subject: {
				Charset: 'UTF-8',
				Data: `Summary Week ${weekNumber}`,
			},
		},
		Source: fromAddress,
		ReplyToAddresses: [
			/* more items */
		],
	})
}

export const handler = async (): Promise<any> => {
	const currentTime = new Date()
	const topDistAndTimeAthletes = await getTopDistanceAndTimeAthlete({
		DatabaseName: dbName,
		TableName: tableName,
	})
	const winners = JSON.stringify(topDistAndTimeAthletes)
	const parsed = JSON.parse(winners)
	const sendEmailCommand = createSendEmailCommand(
		'lena.haraldseid@nordicsemi.no',
		'lena.haraldseid@nordicsemi.no',
		weekNumber(currentTime),
		parsed,
	)

	try {
		return await ses.send(sendEmailCommand)
	} catch (e) {
		console.error('Failed to send email.')
		return e
	}
}
