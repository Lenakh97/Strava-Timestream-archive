import { calculateHourlyPoints } from './calculateHourlyPoints.js'
import { getDistanceForAllTeams } from './getDistanceForAllTeams.js'
import { getMemberCount } from './getMemberCount.js'
import { getPointsForGraph } from './getPointsForGraph.js'

import { getTotalDistance } from './getTotalDistance.js'
import { getTotalHoursSpent } from './getTotalHoursSpent.js'
import { getTotalTimePerClub } from './getTotalTimePerClub.js'
import type { Team } from './lambdas/teamList.js'
import { weekNumber } from './weekNumber.js'

export type WeeklySummary = {
	weekNumber: number
	distance: number
	teamInformation: TeamInformation
}

export type TeamInformation = {
	teamId: number
	teamName: string
	points: number
	minutesPerAthlete: number
	distance: number
}[]

export type Summary = {
	overall: {
		// Hardcoded goal from last year
		distanceGoal: number
		currentDistance: number
		totalHours: number
	}
	weeks: WeeklySummary[]
}

export const getSummary = async ({
	DatabaseName,
	TableName,
	teamInfo,
}: {
	DatabaseName: string
	TableName: string
	teamInfo: Team[]
}): Promise<Summary> => {
	const StravaChallengeWeeks = [13]
	const currentTime = new Date()
	const memberCount = await getMemberCount({
		DatabaseName: DatabaseName,
		TableName: TableName,
	})
	let totDist = 0
	let totHours = 0
	const weeklyArray = [] as WeeklySummary[]
	const teamInfoArray = [] as TeamInformation
	for (const week of StravaChallengeWeeks) {
		const timePerAthlete = await getTotalTimePerClub({
			DatabaseName: DatabaseName,
			TableName: TableName,
			teamInfo: memberCount,
			weekNumber: week,
		})
		const hourlyPoints = calculateHourlyPoints(timePerAthlete)
		const pointsForGraph = await getPointsForGraph({
			DatabaseName: DatabaseName,
			TableName: TableName,
			teamInfo: memberCount,
			teamInfoTime: timePerAthlete,
			teamInfoHourlyPoints: hourlyPoints,
			weekNumber: week,
		})
		const distance = await getDistanceForAllTeams({
			DatabaseName: DatabaseName,
			TableName: TableName,
			weekNumber: week,
		})
		const weeklyDistance = await getTotalDistance({
			DatabaseName: DatabaseName,
			TableName: TableName,
			weekNumber: week,
		})
		for (const team of teamInfo) {
			teamInfoArray.push({
				teamId: team.id,
				teamName: team.name,
				points: pointsForGraph?.[team.id]?.points ?? 0,
				minutesPerAthlete: timePerAthlete?.[team.id]?.minutesPerAthlete ?? 0,
				distance: distance?.[team.id]?.distance ?? 0,
			})
		}
		weeklyArray.push({
			weekNumber: week,
			distance: weeklyDistance,
			teamInformation: teamInfoArray,
		})
		totDist += await getTotalDistance({
			DatabaseName: DatabaseName,
			TableName: TableName,
			weekNumber: week,
		})
		totHours += await getTotalHoursSpent({
			DatabaseName: DatabaseName,
			TableName: TableName,
			weekNumber: weekNumber(currentTime),
		})
	}
	return {
		overall: {
			distanceGoal: 15726.7,
			currentDistance: totDist,
			totalHours: totHours,
		},
		weeks: weeklyArray,
	}
}
