import { SendEmailCommand } from '@aws-sdk/client-ses'

export const createSendEmailCommand = (
	toAddress: string,
	fromAddress: string,
	content: string,
	subject: string,
): SendEmailCommand => {
	return new SendEmailCommand({
		Destination: {
			CcAddresses: [],
			ToAddresses: [toAddress],
		},
		Message: {
			Body: {
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
				Data: subject,
			},
		},
		Source: fromAddress,
		ReplyToAddresses: [],
	})
}
