import { calculateHourlyPoints } from './calculateHourlyPoints.js'

describe('calculateHourlyPoints()', () => {
	it('should calculate hourly points for the teams', () => {
		const expectedMemberCount = {
			'42': { hourlyPoints: 3 },
			'43': { hourlyPoints: 2 },
			'44': { hourlyPoints: 1 },
			'45': { hourlyPoints: 0 },
			'46': { hourlyPoints: 0 },
			'47': { hourlyPoints: 4 },
		}

		expect(calculateHourlyPoints(teamInfoTime)).toEqual(expectedMemberCount)
	})
})

const teamInfoTime = {
	'46': { minutesPerAthlete: 133.06666666666666 },
	'42': { minutesPerAthlete: 143.06666666666666 },
	'44': { minutesPerAthlete: 141.06666666666666 },
	'45': { minutesPerAthlete: 140.06666666666666 },
	'47': { minutesPerAthlete: 153.06666666666666 },
	'43': { minutesPerAthlete: 142.06666666666666 },
}
