import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getTotalDistance } from './getTotalDistance.js'
import { stravaToTimestream } from './stravaToTimestream.js'
import testData from '../../test-data/activities.json'
import { weekNumber } from '../weekNumber.js'

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

describe('getTotalDistance()', () => {
	it('should return the total distance', async () => {
		// Fill Timestream table with test data
		await tsw.send(
			new WriteRecordsCommand({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				Records: stravaToTimestream(42, currentTime, testData),
			}),
		)

		const expectedDistance = 38.411199999999994
		expect(expectedDistance).toBeGreaterThan(0)
		expect(
			await getTotalDistance({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				weekNumber: weekNumber(currentTime),
			}),
		).toEqual(expectedDistance)
	})
})
