import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'

export const getTotalHoursSpent = async ({
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
			QueryString: `SELECT SUM(measure_value::double) / 60 / 60 FROM "${DatabaseName}"."${TableName}" WHERE measure_name = 'elapsed_time' AND (SELECT week(time)=${weekNumber})`,
		}),
	)
	return parseFloat(result?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0')
}
