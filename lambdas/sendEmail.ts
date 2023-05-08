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
	console.log(Object.values(parsed['232813'].distance))
	/*const content =
		`Top athletes` +
		'<br> <b>Omega:</b> ' +
		Object.values(parsed['232813']).slice(0, 3) +
		'<br> <b>Oslo:</b>' +
		Object.values(parsed['838200']).slice(0, 3) +
		'<br> <b>Trondheim:</b>' +
		Object.values(parsed['838203']).slice(0, 3) +
		'<br> <b>Finland: </b>' +
		Object.values(parsed['838205']).slice(0, 3) +
		'<br> <b>APAC: </b>' +
		Object.values(parsed['838207']).slice(0, 3) +
		'<br> <b>USA: </b>' +
		Object.values(parsed['838209']).slice(0, 3) +
		'<br> <b>Europe:</b>' +
		Object.values(parsed['838211']).slice(0, 3) +
		'<br> <b>Poland:</b>' +
		Object.values(parsed['982093']).slice(0, 3)*/
	//console.log(JSON.stringify(content))
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
