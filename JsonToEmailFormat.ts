import type { Team } from 'lambdas/teamList.js'

export const JsonToEmailFormat = (
	winnersObject: {
		'232813': string[]
		'838200': string[]
		'838203': string[]
		'838205': string[]
		'838207': string[]
		'838209': string[]
		'838211': string[]
		'982093': string[]
	},
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
