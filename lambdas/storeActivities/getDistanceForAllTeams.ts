import {
	QueryCommand,
	Row,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'

export type DistanceInfo = Record<string, { distance: number }>

export const getDistanceForAllTeams = async ({
	DatabaseName,
	TableName,
	weekNumber,
}: {
	DatabaseName: string
	TableName: string
	weekNumber: number
}): Promise<DistanceInfo> => {
	const tsq = new TimestreamQueryClient({})
	const teamInfo = {} as DistanceInfo
	//use this method to be able to use unit test
	/*const teams = await tsq.send(
		selectTeamsQuery(DatabaseName, TableName)//  returns -> new QueryCommand({QueryString: `SELECT DISTINCT Team FROM "${DatabaseName}"."${TableName}"`,}),
	)*/
	const teams = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT DISTINCT Team FROM "${DatabaseName}"."${TableName}"`,
		}),
	)
	const teamArray = []
	const rows = teams?.Rows as Row[]
	for (const tsData of rows) {
		teamArray.push(tsData?.Data?.[0]?.ScalarValue)
	}
	for (const TeamID of teamArray) {
		const result = await tsq.send(
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
                    END) / 1000 FROM "${DatabaseName}"."${TableName}" WHERE measure_name='distance' AND Team='${TeamID}' AND (SELECT week(time)=${weekNumber})`,
			}),
		)
		if (TeamID === undefined) {
			continue
		}
		teamInfo[TeamID] = {
			distance: parseFloat(result?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0'),
		}
	}

	return teamInfo
}
