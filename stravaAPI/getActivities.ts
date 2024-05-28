import https from 'node:https'
import type { StravaActivity } from 'lambdas/storeActivities/stravaToTimestream.js'

export const getActivities = async ({
	team,
	accessToken,
	startTimestamp,
}: {
	team: number
	accessToken: string
	startTimestamp: number
}): Promise<StravaActivity[]> =>
	new Promise((resolve) => {
		https
			.request(
				`https://www.strava.com/api/v3/clubs/${team}/activities?access_token=${accessToken}&per_page=200&after=${startTimestamp}`,
				(res) => {
					const responseData: StravaActivity[] = []

					res.on('data', (data) => {
						responseData.push(data.toString())
					})

					res.on('end', () => {
						resolve(JSON.parse(responseData.join('')))
					})
				},
			)
			.end()
	})
