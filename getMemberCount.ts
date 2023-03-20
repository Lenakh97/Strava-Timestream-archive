import {
	QueryCommand,
	Row,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'

export type TeamInfo = Record<string, { memberCount: number }>

export const getMemberCount = async ({
	DatabaseName,
	TableName,
}: {
	DatabaseName: string
	TableName: string
}): Promise<TeamInfo> => {
	const tsq = new TimestreamQueryClient({})
	const teamInfo = {} as TeamInfo
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
				QueryString: `SELECT COUNT (DISTINCT athlete) FROM "${DatabaseName}"."${TableName}" WHERE Team='${TeamID}'`,
			}),
		)
		if (TeamID === undefined) {
			continue
		}
		teamInfo[TeamID] = {
			memberCount: parseFloat(result?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0'),
		}
	}

	return teamInfo
}
