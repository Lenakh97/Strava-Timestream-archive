import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import { parseResult } from '@nordicsemiconductor/timestream-helpers'

export type TeamInfo = Record<string, { memberCount: number }>

export const getMemberCount = async ({
	DatabaseName,
	TableName,
}: {
	DatabaseName: string
	TableName: string
}): Promise<TeamInfo> => {
	const tsq = new TimestreamQueryClient({})
	const teams = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT COUNT (DISTINCT athlete) as memberCount, Team as teamId FROM "${DatabaseName}"."${TableName}" WHERE time > '2023-04-17 00:00:00' GROUP BY Team`,
		}),
	)
	return parseResult<{ memberCount: string; teamId: string }>(teams).reduce(
		(teams, { memberCount, teamId }) => ({
			...teams,
			[teamId]: { memberCount: parseInt(memberCount, 10) },
		}),
		{} as TeamInfo,
	)
}
