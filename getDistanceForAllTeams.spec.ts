import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getDistanceForAllTeams } from './getDistanceForAllTeams.js'
import { stravaToTimestream } from './stravaToTimestream'
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

describe('getDistanceForAllTeams()', () => {
	it('should return the total distance', async () => {
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

		const expectedDistance = {
			'42': {
				distance: 38.411199999999994,
			},
			'43': {
				distance: 38.411199999999994,
			},
		}
		expect(
			await getDistanceForAllTeams({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				weekNumber: weekNumber(currentTime),
			}),
		).toEqual(expectedDistance)
	})
})
