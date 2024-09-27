import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { jest } from '@jest/globals'
import { randomUUID } from 'crypto'
import { TEST_DB_NAME as testDatabaseName } from '../../config.js'
import testData from '../../test-data/activities.json'
import { weekNumber } from '../weekNumber.js'
import { getTotalTimePerClub } from './getTotalTimePerClub.js'
import { stravaToTimestream } from './stravaToTimestream.js'

const tsw = new TimestreamWriteClient({})
const testTableName = randomUUID()
const currentTime = new Date()
jest.setTimeout(30 * 1000)

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
				Records: stravaToTimestream(42, currentTime, testData, []),
			}),
		)
		await tsw.send(
			new WriteRecordsCommand({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				Records: stravaToTimestream(43, currentTime, testData, []),
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
				weekNumber: weekNumber(currentTime),
			}),
		).toEqual(expectedMinutesPerAthlete)
	})
})
