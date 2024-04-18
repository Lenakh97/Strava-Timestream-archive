import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getTopDistanceAndTimeAthlete } from './getTopDistanceAndTimeAthlete.js'
import { stravaToTimestream } from '../storeActivities/stravaToTimestream.js'
import testData from '../../test-data/activities2.json'
import testData2 from '../../test-data/activities3.json'

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

describe('getTopDistanceAndTimeAthlete()', () => {
	it('should return the top distance and time for athlete', async () => {
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
				Records: stravaToTimestream(43, currentTime, testData2),
			}),
		)

		const expectedTopDistanceAthlete = {
			'42': {
				'Alex L.': { distance: 20.749533333333333, time: 4.425555555555556 },
				'Eduardo M.': { distance: 17.386966666666667, time: 4.418611111111111 },
				'Murat B.': { distance: 6.7508, time: 1.0438888888888889 },
			},
			'43': {
				'Alex L.': { distance: 20.749533333333333, time: 4.425555555555556 },
				'Eduardo M.': { distance: 17.386966666666667, time: 4.418611111111111 },
				'Ola B.': { distance: 6.7508, time: 1.0438888888888889 },
			},
		}
		expect(
			await getTopDistanceAndTimeAthlete({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
			}),
		).toEqual(expectedTopDistanceAthlete)
	})
})
export type AthleteDistanceInfo = Record<
	string,
	{ distance: number; time: number }
>
