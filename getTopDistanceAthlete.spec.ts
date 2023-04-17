import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getTopDistanceAthlete } from './getTopDistanceAthlete'
import { stravaToTimestream } from './stravaToTimestream'
import testData from './test-data/activities2.json'

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

describe('getTopDistanceAthlete()', () => {
	it('should return the total distance', async () => {
		// Fill Timestream table with test data
		await tsw.send(
			new WriteRecordsCommand({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				Records: stravaToTimestream(42, currentTime, testData),
			}),
		)

		const expectedTopDistanceAthlete = {
			'Alex L.': { distance: 20749.533333333333 },
			'Eduardo M.': { distance: 17386.966666666667 },
			'Murat B.': { distance: 6750.8 },
		}
		expect(
			await getTopDistanceAthlete({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
			}),
		).toEqual(expectedTopDistanceAthlete)
	})
})
export type AthleteDistanceInfo = Record<string, { distance: number }>
