import type { HourlyPoints } from './getPointsForGraph.js'
import type { TeamInfoTime } from './getTotalTimePerClub.js'

export const calculateHourlyPoints = (
	teamInfoTime: TeamInfoTime,
): HourlyPoints => {
	const hourlyPoints = {} as HourlyPoints
	const newArr = Object.entries(teamInfoTime)
	newArr.sort(
		(
			[, { minutesPerAthlete: minutes1 }],
			[, { minutesPerAthlete: minutes2 }],
		) => minutes2 - minutes1,
	)
	let points = 4
	for (const [ID] of newArr) {
		if (points > 0) {
			hourlyPoints[ID] = {
				hourlyPoints: points,
			}
			points -= 1
		} else {
			hourlyPoints[ID] = {
				hourlyPoints: 0,
			}
		}
	}
	return hourlyPoints
}
