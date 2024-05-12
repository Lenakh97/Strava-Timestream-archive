import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'

export const getTotalDistance = async ({
	DatabaseName,
	TableName,
	weekNumber,
}: {
	DatabaseName: string
	TableName: string
	weekNumber: number
}): Promise<number> => {
	const tsq = new TimestreamQueryClient({})
	const result = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT SUM(
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
                        ELSE measure_value::double
                    END) / 1000 FROM "${DatabaseName}"."${TableName}" WHERE measure_name='distance' AND (SELECT week(time)=${weekNumber})`,
		}),
	)
	return parseFloat(result?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0')
}
