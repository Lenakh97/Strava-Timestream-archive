import {
	QueryCommand,
	Row,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import type { AthleteDistanceInfo } from './getTopDistanceAndTimeAthlete.spec.ts'
import { startDateString } from '../../config.js'

export const getTopDistanceAndTimeAthlete = async ({
	DatabaseName,
	TableName,
}: {
	DatabaseName: string
	TableName: string
}): Promise<Record<string, AthleteDistanceInfo>> => {
	const tsq = new TimestreamQueryClient({})
	const teams = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT DISTINCT Team FROM "${DatabaseName}"."${TableName}"`,
		}),
	)
	const teamInfoTopDistance = {} as Record<string, AthleteDistanceInfo>
	const teamArray = [] as string[]
	const rows = teams?.Rows as Row[]
	for (const tsData of rows) {
		teamArray.push(tsData?.Data?.[0]?.ScalarValue ?? '')
	}
	for (const TeamID of teamArray) {
		const memberCount = await tsq.send(
			new QueryCommand({
				QueryString: `SELECT COUNT (DISTINCT athlete) FROM "${DatabaseName}"."${TableName}" WHERE Team='${TeamID}' AND time > '${startDateString}'`,
			}),
		)
		const numberOfAthletes = parseInt(
			memberCount?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0',
		)
		const athletes = await tsq.send(
			new QueryCommand({
				QueryString: `SELECT DISTINCT athlete FROM "${DatabaseName}"."${TableName}" WHERE Team='${TeamID}' AND time > '${startDateString}'`,
			}),
		)
		const athleteDistances = {} as AthleteDistanceInfo
		for (let member = 0; member < numberOfAthletes; member++) {
			const athleteName = athletes?.Rows?.[member]?.Data?.[0]?.ScalarValue ?? ''
			const totalDistance = await tsq.send(
				new QueryCommand({
					QueryString: `SELECT SUM(
                    CASE
                        WHEN activity_type = 'Ride' 
                            OR activity_type = 'VirtualRide' 
                            OR activity_type = 'GravelRide' 
                            OR activity_type = 'RollerSki' 
                            OR activity_type = 'NordicSki' THEN measure_value::double / 3
						WHEN activity_type = 'MountainBikeRide' THEN measure_value::double /2
                        WHEN activity_type = 'Swim' THEN measure_value::double * 4
                        WHEN activity_type = 'EBikeRide' THEN measure_value::double / 5
                        WHEN activity_type = 'Snowboard' THEN measure_value::double * 0
                        WHEN activity_type = 'AlpineSki' THEN measure_value::double * 0
                        WHEN activity_type = 'Golf' THEN measure_value::double * 0
						ELSE measure_value::double
                    END) / 1000 FROM "${DatabaseName}"."${TableName}" WHERE measure_name='distance' AND athlete='${athleteName}' AND Team='${TeamID}' AND time > '${startDateString}' `,
				}),
			)
			const totalTime = await tsq.send(
				new QueryCommand({
					QueryString: `SELECT SUM(measure_value::double) / 60 / 60 FROM "${DatabaseName}"."${TableName}" WHERE measure_name='elapsed_time' AND Team='${TeamID}' AND athlete='${athleteName}' AND time > '${startDateString}'  `,
				}),
			)
			athleteDistances[athleteName] = {
				distance: parseFloat(
					totalDistance?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0',
				),
				time: parseFloat(totalTime?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0'),
			}
		}

		teamInfoTopDistance[TeamID] = athleteDistances
	}
	return teamInfoTopDistance
}
