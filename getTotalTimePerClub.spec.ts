import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getTotalTimePerClub } from './getTotalTimePerClub.js'
import { stravaToTimestream } from './stravaToTimestream.js'
import testData from './test-data/activities.json'

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

describe('getTotalTimePerClub()', () => {
	it('should return the amount of active minutes per athlete in each club', async () => {
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
		const expectedMinutesPerAthlete = {
			'42': { minutesPerAthlete: 143.06666666666666 },
			'43': { minutesPerAthlete: 143.06666666666666 },
		}

		expect(
			await getTotalTimePerClub({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				teamInfo: {
					'42': { memberCount: 3 },
					'43': { memberCount: 3 },
				},
			}),
		).toEqual(expectedMinutesPerAthlete)
	})
})
