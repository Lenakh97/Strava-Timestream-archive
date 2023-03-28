import {
	CreateTableCommand,
	DeleteTableCommand,
	TimestreamWriteClient,
	WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write'
import { randomUUID } from 'crypto'
import { getSummary, Summary } from './getSummary.js'
import { stravaToTimestream } from './stravaToTimestream.js'
import testData from './test-data/activities.json'
import { weekNumber } from './weekNumber.js'

const tsw = new TimestreamWriteClient({})
const testDatabaseName = process.env.TEST_DB_NAME as string
const testTableName = randomUUID()
export const currentTime = new Date()

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

describe('getSummary()', () => {
	it('should return a summary', async () => {
		// TODO: Fill table // Fill Timestream table with test data
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

		const expectedResult: Summary = {
			overall: {
				currentDistance:
					(testData.reduce((total, { distance }) => total + distance, 0) * 2) /
					1000,
				totalHours:
					(testData.reduce(
						(total, { elapsed_time }) => total + elapsed_time,
						0,
					) *
						2) /
					60 /
					60,
				distanceGoal: 15726.7, // Hardcoded goal from last year
			},
			weeks: [
				{
					weekNumber: weekNumber(currentTime),
					distance:
						(testData.reduce((total, { distance }) => total + distance, 0) *
							2) /
						1000,
					teamInformation: [
						{
							teamId: 42,
							teamName: 'Team A',
							points: 16.803733333333334,
							minutesPerAthlete: 143.06666666666666,
							distance:
								testData.reduce((total, { distance }) => total + distance, 0) /
								1000,
						},
						{
							teamId: 43,
							teamName: 'Team B',
							points: 15.803733333333332,
							minutesPerAthlete: 143.06666666666666,
							distance: 105.10740000000001,
						},
					],
				},
			],
		}

		expect(
			await getSummary({
				DatabaseName: testDatabaseName,
				TableName: testTableName,
				teamInfo: [
					{ id: 42, name: 'Team A' },
					{ id: 43, name: 'Team B' },
				],
				StravaChallengeWeeks: [weekNumber(currentTime)],
			}),
		).toMatchObject(expectedResult)
	})
})
