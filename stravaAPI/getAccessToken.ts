import https from 'node:https'

export const getAccessToken = async ({
	CLIENT_ID,
	CLIENT_SECRET,
	REFRESH_TOKEN,
}: {
	CLIENT_ID: string
	CLIENT_SECRET: string
	REFRESH_TOKEN: string
}): Promise<string> =>
	new Promise((resolve) => {
		https
			.request(
				{
					hostname: 'www.strava.com',
					path: `/api/v3/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`,
					method: 'POST',
				},
				(res) => {
					res.on('data', (data) => {
						resolve(JSON.parse(data.toString()).access_token)
					})
				},
			)
			.end()
	})
