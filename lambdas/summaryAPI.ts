import { fromEnv } from '@nordicsemiconductor/from-env'
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
} from 'aws-lambda'
import { calculateHourlyPoints } from '../calculateHourlyPoints.js'
import { getMemberCount } from '../getMemberCount.js'
import { getPointsForGraph } from '../getPointsForGraph.js'
import { getTotalDistance } from '../getTotalDistance.js'
import { getTotalHoursSpent } from '../getTotalHoursSpent.js'
import { getTotalTimePerClub } from '../getTotalTimePerClub.js'
import { weekNumber } from '../weekNumber.js'

export type StravaSummaryObject = {
	distanceGoal: number
	currentDistance: number
}
/*
const { tableInfo, clientID, clientSecret, refreshToken } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
	clientID: 'CLIENT_ID',
	clientSecret: 'CLIENT_SECRET',
	refreshToken: 'REFRESH_TOKEN',
})(process.env)*/

const { tableInfo } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-S1mQFez6xa7o|table-RF9ZgR5BtR1K
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

export const handler = async (
	event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
	console.log(JSON.stringify(event))
	/*const accessToken = await getAccessToken({
		CLIENT_ID: clientID,
		CLIENT_SECRET: clientSecret,
		REFRESH_TOKEN: refreshToken,
	})*/
	const StravaChallengeWeeks = [13, 14, 15, 16, 17]
	const memberCount = await getMemberCount({
		DatabaseName: dbName,
		TableName: tableName,
	})
	/*
	const team = 232813
	const clubInfo = await getTeamInfo({
		team,
		accessToken: 'dbc28ec29b6aac24956af7c09610877615ec2e4a',
	})*/
	let totDist = 0
	const weeklyDataAllWeeks = []
	for (const week of StravaChallengeWeeks) {
		const timePerAthlete = await getTotalTimePerClub({
			DatabaseName: dbName,
			TableName: tableName,
			teamInfo: memberCount,
			weekNumber: week,
		})
		const hourlyPoints = calculateHourlyPoints(timePerAthlete)
		weeklyDataAllWeeks.push({
			weekNumber: week,
			distance: await getTotalDistance({
				DatabaseName: dbName,
				TableName: tableName,
				weekNumber: week,
			}),
			pointsForGraph: await getPointsForGraph({
				DatabaseName: dbName,
				TableName: tableName,
				teamInfo: memberCount,
				teamInfoTime: timePerAthlete,
				teamInfoHourlyPoints: hourlyPoints,
				weekNumber: week,
			}),
			timePerAthlete: timePerAthlete,
		})
		totDist += await getTotalDistance({
			DatabaseName: dbName,
			TableName: tableName,
			weekNumber: week,
		})
	}
	const currentTime = new Date()
	const currentWeekTimePerAthlete = await getTotalTimePerClub({
		DatabaseName: dbName,
		TableName: tableName,
		teamInfo: memberCount,
		weekNumber: weekNumber(currentTime),
	})
	const hourlyPoints = calculateHourlyPoints(currentWeekTimePerAthlete)
	const currentWeek = []

	currentWeek.push({
		distance: await getTotalDistance({
			DatabaseName: dbName,
			TableName: tableName,
			weekNumber: weekNumber(currentTime),
		}),
		pointsForGraph: await getPointsForGraph({
			DatabaseName: dbName,
			TableName: tableName,
			teamInfo: memberCount,
			teamInfoTime: currentWeekTimePerAthlete,
			teamInfoHourlyPoints: hourlyPoints,
			weekNumber: weekNumber(currentTime),
		}),
		timePerAthlete: currentWeekTimePerAthlete,
	})
	const totalHours = await getTotalHoursSpent({
		DatabaseName: dbName,
		TableName: tableName,
		weekNumber: weekNumber(currentTime),
	})

	//const summary: StravaSummaryObject[] = []
	const distanceGoal = 15726.7
	const summary = {
		distanceGoal: distanceGoal,
		currentDistance: totDist,
		totalHours: totalHours,
	}
	return {
		statusCode: 200,
		body: JSON.stringify({ summary, weeklyDataAllWeeks, currentWeek }, null, 2),
	}
}
