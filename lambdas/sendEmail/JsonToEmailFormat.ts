import type { Team } from 'lambdas/teamList.js'

export type WinnersObject = {
	'1174791': string[]
	'1174162': string[]
	'1174140': string[]
	'1174164': string[]
	'1174167': string[]
	'1174168': string[]
	'1174166': string[]
	'1174165': string[]
}
export const JsonToEmailFormat = (
	winnersObject: WinnersObject,
	teamList: Team[],
): string => {
	let returnString = ''
	const teams = Object.keys(winnersObject)
	const winners = Object.values(winnersObject)
	for (const team in teams) {
		const currentTeam = teams[team] ?? ''
		let teamName = ''
		for (const team of teamList) {
			if (team.id.toString() === currentTeam) {
				teamName = team.name
			}
		}
		returnString += '<b>' + teamName + '</b>' + '<br>'
		const teamWinners = winners[team] ?? []
		for (const winners of teamWinners) {
			returnString += winners + '<br>'
		}
	}
	return returnString
}
