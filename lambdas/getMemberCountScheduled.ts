import {
	QueryCommand,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'
import { parseResult } from '@nordicsemiconductor/timestream-helpers'
import type { TeamInfo } from './getMemberCount.js'

export const getMemberCountScheduled = async ({
	tsq,
	db,
	table,
}: {
	tsq: TimestreamQueryClient
	db: string
	table: string
}): Promise<TeamInfo> => {
	const res = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT * FROM "${db}"."${table}" WHERE time = bin(now(), 1d)`,
		}),
	)
	return parseResult<{
		teamId: string
		measure_name: string
		time: Date
		memberCount: string
	}>(res).reduce(
		(info, { teamId, memberCount }) => ({
			...info,
			[parseInt(teamId, 10)]: {
				memberCount: parseInt(memberCount, 10),
			},
		}),
		{} as TeamInfo,
	)
}
