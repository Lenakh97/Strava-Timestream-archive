import {
	QueryCommand,
	Row,
	TimestreamQueryClient,
} from '@aws-sdk/client-timestream-query'

export const getRandomWeeklyWinners = async ({
	DatabaseName,
	TableName,
	weekNumber,
}: {
	DatabaseName: string
	TableName: string
	weekNumber: number
}): Promise<Record<string, string[]>> => {
	const tsq = new TimestreamQueryClient({})

	const teams = await tsq.send(
		new QueryCommand({
			QueryString: `SELECT DISTINCT Team FROM "${DatabaseName}"."${TableName}"`,
		}),
	)
	const teamArray = [] as string[]
	const rows = teams?.Rows as Row[]
	for (const tsData of rows) {
		teamArray.push(tsData?.Data?.[0]?.ScalarValue ?? '')
	}
	const randomWinnersAllTeams = {} as RandomWinnersType
	for (const TeamID of teamArray) {
		const athletes = await tsq.send(
			new QueryCommand({
				QueryString: `SELECT athlete FROM "${DatabaseName}"."${TableName}" WHERE Team='${TeamID}' AND (SELECT week(time)=${weekNumber})`,
			}),
		)
		const memberCount = await tsq.send(
			new QueryCommand({
				QueryString: `SELECT COUNT(athlete) FROM "${DatabaseName}"."${TableName}" WHERE Team='${TeamID}' AND (SELECT week(time)=${weekNumber})`,
			}),
		)
		const numberOfAthletes = parseInt(
			memberCount?.Rows?.[0]?.Data?.[0]?.ScalarValue ?? '0',
		)
		let arrayOfAthletes = [] as string[]
		for (let member = 0; member < numberOfAthletes; member++) {
			arrayOfAthletes.push(
				athletes?.Rows?.[member]?.Data?.[0]?.ScalarValue ?? '',
			)
		}
		const winnersArray = [] as string[]

		for (let person = 0; person < 5; person++) {
			if (arrayOfAthletes.length === 0) {
				continue
			}
			const randomPerson = arrayOfAthletes[
				Math.floor(Math.random() * arrayOfAthletes.length)
			] as string
			winnersArray.push(randomPerson)
			arrayOfAthletes = arrayOfAthletes.filter((i) => i !== randomPerson)
		}
		randomWinnersAllTeams[TeamID] = winnersArray
	}
	return randomWinnersAllTeams
}

export type RandomWinnersType = Record<string, string[]>
