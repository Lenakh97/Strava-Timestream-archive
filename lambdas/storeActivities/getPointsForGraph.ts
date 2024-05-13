import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import type { TeamInfo } from 'lambdas/getMemberCount'
import type { TeamInfoTime } from './getTotalTimePerClub'

export type ClubPoints = Record<string, { points: number }>
export type HourlyPoints = Record<string, { hourlyPoints: number }>

export const getPointsForGraph = async ({
	DatabaseName,
	TableName,
	teamInfo,
	teamInfoTime,
	teamInfoHourlyPoints,
	weekNumber,
}: {
	DatabaseName: string
	TableName: string
	teamInfo: TeamInfo
	teamInfoTime: TeamInfoTime
	teamInfoHourlyPoints: HourlyPoints
	weekNumber: number
}): Promise<ClubPoints> => {
	const clubPoints = {} as ClubPoints
	const teamArray = Object.keys(teamInfo)
	const tsq = new TimestreamQueryClient({})
	for (const TeamID of teamArray) {
		//const hPoints = teamInfoHourlyPoints[TeamID]?.hourlyPoints
		const distancePoints = await tsq.send(
			new QueryCommand({
				QueryString: `
                SELECT (SUM(
                    CASE
                        WHEN activity_type = 'Ride' 
                            OR activity_type = 'VirtualRide' 
                            OR activity_type = 'GravelRide' 
                            OR activity_type = 'RollerSki' 
                            OR activity_type = 'NordicSki' THEN measure_value::double / 3
                        WHEN activity_type = 'MountainBikeRide' THEN measure_value::double / 2
                        WHEN activity_type = 'Swim' THEN measure_value::double * 4
                        WHEN activity_type = 'EBikeRide' THEN measure_value::double / 5
                        WHEN activity_type = 'Snowboard' THEN measure_value::double * 0
                        WHEN activity_type = 'AlpineSki' THEN measure_value::double * 0
						WHEN activity_type = 'Golf' THEN measure_value::double * 0
                        ELSE measure_value::double
                    END)/ 1000 / ${teamInfo[TeamID]?.memberCount})
                FROM "${DatabaseName}"."${TableName}" 
                WHERE (measure_name = 'distance')
                AND Team='${TeamID}'
                AND (SELECT week(time)=${weekNumber})`,
			}),
		)
		const noDistancePoints = await tsq.send(
			new QueryCommand({
				QueryString: `
                SELECT (SUM(
                    measure_value::double
                    )/ 1000 / ${teamInfo[TeamID]?.memberCount}) 
                FROM "${DatabaseName}"."${TableName}" 
                WHERE (measure_name = 'nodistance_points')
                AND Team='${TeamID}'
                AND (SELECT week(time)=${weekNumber})`,
			}),
		)
		const totalPoints =
			parseFloat(distancePoints?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0') +
			parseFloat(noDistancePoints?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0')
		clubPoints[TeamID] = {
			points: totalPoints,
		}
	}
	return clubPoints
}
