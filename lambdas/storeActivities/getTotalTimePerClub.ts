import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import type { TeamInfo } from '../getMemberCount.js'

export type TeamInfoTime = Record<string, { minutesPerAthlete: number }>

export const getTotalTimePerClub = async ({
	DatabaseName,
	TableName,
	teamInfo,
	weekNumber,
}: {
	DatabaseName: string
	TableName: string
	teamInfo: TeamInfo
	weekNumber: number
}): Promise<TeamInfoTime> => {
	const teamArray = Object.keys(teamInfo)
	const tsq = new TimestreamQueryClient({})
	const teamInfoTime = {} as TeamInfoTime
	for (const TeamID of teamArray) {
		const result = await tsq.send(
			new QueryCommand({
				QueryString: `SELECT SUM(measure_value::double) /60 / ${teamInfo[TeamID]?.memberCount}  FROM "${DatabaseName}"."${TableName}" WHERE (measure_name = 'elapsed_time') AND Team='${TeamID}' AND (SELECT week(time)=${weekNumber})`,
			}),
		)
		teamInfoTime[TeamID] = {
			minutesPerAthlete: parseFloat(
				result?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0',
			),
		}
	}
	return teamInfoTime
}
