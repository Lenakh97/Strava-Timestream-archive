import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getPointsForGraph } from './getPointsForGraph.js'
import { stravaToTimestream } from './stravaToTimestream.js'
import testData from './test-data/activities.json'
import { weekNumber } from './weekNumber'

const tsw = new TimestreamWriteClient({})
const testDatabaseName = process.env.TEST_DB_NAME as string
const testTableName = randomUUID()
const currentTime = new Date()

beforeAll(async () => {
	await tsw.send(
		new CreateTableCommand({
			DatabaseName: testDatabaseName,
			TableName: testTableName,
		}),
	)
})

afterAll(async () => {
	await tsw.send(
		new DeleteTableCommand({
			DatabaseName: testDatabaseName,
			TableName: testTableName,
		}),
	)
})

describe('getPointsForGraph()', () => {
	it('should return points for each team to use in Graph', async () => {
		// Fill Timestream table with test data
		await tsw.send(
			new WriteRecordsCommand({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				Records: stravaToTimestream(42, currentTime, testData),
			}),
		)
		await tsw.send(
			new WriteRecordsCommand({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				Records: stravaToTimestream(43, currentTime, testData),
			}),
		)
		//points = total distance (which is divided by a number based on activity) divided by active atlethes in the club
		const expectedGraphPoints = {
			'42': { points: 16.803733333333334 },
			'43': { points: 14.803733333333332 },
		}

		expect(
			await getPointsForGraph({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				teamInfo: {
					'42': { memberCount: 3 },
					'43': { memberCount: 3 },
				},
				teamInfoTime: {
					'42': { minutesPerAthlete: 143.06666666666666 },
					'43': { minutesPerAthlete: 143.06666666666666 },
				},
				teamInfoHourlyPoints: {
					'42': { hourlyPoints: 4 },
					'43': { hourlyPoints: 2 },
				},
				weekNumber: weekNumber(currentTime),
			}),
		).toEqual(expectedGraphPoints)
	})
})
