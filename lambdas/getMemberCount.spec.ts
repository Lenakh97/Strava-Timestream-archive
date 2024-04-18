import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getMemberCount } from './getMemberCount.js'
import { stravaToTimestream } from './storeActivities/stravaToTimestream.js'
import testData from '../test-data/activities.json'

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

describe('getMemberCount()', () => {
	it('should return the member count for the given club', async () => {
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

		const expectedMemberCount = {
			'42': { memberCount: 3 },
			'43': { memberCount: 3 },
		}

		expect(
			await getMemberCount({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
			}),
		).toEqual(expectedMemberCount)
	})
})
