import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import type { AthleteDistanceInfo } from './getTopDistanceAthlete.spec'

export const getTopDistanceAthlete = async ({
	DatabaseName,
	TableName,
}: {
	DatabaseName: string
	TableName: string
}): Promise<AthleteDistanceInfo> => {
	const tsq = new TimestreamQueryClient({})
	const memberCount = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT COUNT (DISTINCT athlete) FROM "${DatabaseName}"."${TableName}"`,
		}),
	)
	const numberOfAthletes = memberCount?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? 0
	const athletes = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT DISTINCT athlete FROM "${DatabaseName}"."${TableName}"`,
		}),
	)
	const athleteDistances = {} as AthleteDistanceInfo
	for (let member = 0; member < numberOfAthletes; member++) {
		const athleteName = athletes?.Rows?.[member]?.Data?.[0]?.ScalarValue
		const totalDistance = await tsq.send(
			new QueryCommand({
				QueryString: `SELECT SUM(
                    CASE
                        WHEN activity_type = 'Ride' 
                            OR activity_type = 'VirtualRide' 
                            OR activity_type = 'GravelRide' 
                            OR activity_type = 'RollerSki' 
                            OR activity_type = 'NordicSki'
                            OR activity_type = 'BackCountrySki'
                            OR activity_type = 'MountainBikeRide' THEN measure_value::double / 3
                        WHEN activity_type = 'Swim' THEN measure_value::double * 4
                        WHEN activity_type = 'EBikeRide' THEN measure_value::double / 5
                        WHEN activity_type = 'Snowboard' THEN measure_value::double * 0
                        WHEN activity_type = 'AlpineSki' THEN measure_value::double * 0
                        ELSE measure_value::double
                    END) FROM "${DatabaseName}"."${TableName}" WHERE measure_name='distance' AND athlete='${athleteName}' `,
			}),
		)
		if (athleteName === undefined) {
			continue
		}
		athleteDistances[athleteName] = {
			distance: parseFloat(
				totalDistance?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0',
			),
		}
	}
	return athleteDistances
}
