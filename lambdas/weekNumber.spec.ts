import { weekNumber } from './weekNumber.js'

describe('weekNumber()', () => {
	it('should return a week for a date', () => {
		expect(weekNumber(new Date(1663592441 * 1000))).toEqual(38)
	})
})
