import { stravaToTimestream } from './stravaToTimestream.js'

describe('stravaToTimestream', () => {
	it('should convert Strava activity data to Timestream records', () => {
		const currentTime = new Date()
		const result = stravaToTimestream(42, currentTime, [
			{
				resource_state: 2,
				athlete: {
					resource_state: 2,
					firstname: 'Murat',
					lastname: 'B.',
				},
				name: 'Morning Run',
				distance: 5063.1,
				moving_time: 1879,
				elapsed_time: 1879,
				total_elevation_gain: 51.2,
				type: 'Run',
				sport_type: 'Run',
				workout_type: null,
			},
			{
				resource_state: 2,
				athlete: {
					resource_state: 2,
					firstname: 'Alex',
					lastname: 'L.',
				},
				name: 'Morning Ride',
				distance: 47883.4,
				moving_time: 6352,
				elapsed_time: 7966,
				total_elevation_gain: 803,
				type: 'Ride',
				sport_type: 'Ride',
				workout_type: null,
			},
			{
				resource_state: 2,
				athlete: {
					resource_state: 2,
					firstname: 'Lena Kråkevik',
					lastname: 'H.',
				},
				name: 'Morning Weight Training',
				distance: 0.0,
				moving_time: 2833,
				elapsed_time: 2833,
				total_elevation_gain: 0,
				type: 'WeightTraining',
				sport_type: 'WeightTraining',
			},
		])
		expect(result).toContainEqual({
			Dimensions: [
				{ Name: 'Team', Value: '42', dimensionValueType: 'INT' },
				{
					Name: 'activity_id',
					Value: 'cf607ad3181a60e2b8a25ac977c4d627f8c0a591',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'athlete',
					Value: 'Murat B.',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'activity_type',
					Value: 'Run',
					dimensionValueType: 'VARCHAR',
				},
			],
			MeasureName: 'distance',
			MeasureValue: '5063.1',
			MeasureValueType: 'DOUBLE',
			Time: currentTime.getTime().toString(),
		})
		expect(result).toContainEqual({
			Dimensions: [
				{ Name: 'Team', Value: '42', dimensionValueType: 'INT' },
				{
					Name: 'activity_id',
					Value: '473a55b4341d5ab64affde12803abee527d5a9f6',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'athlete',
					Value: 'Alex L.',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'activity_type',
					Value: 'Ride',
					dimensionValueType: 'VARCHAR',
				},
			],
			MeasureName: 'distance',
			MeasureValue: '47883.4',
			MeasureValueType: 'DOUBLE',
			Time: currentTime.getTime().toString(),
		})
		expect(result).toContainEqual({
			Dimensions: [
				{ Name: 'Team', Value: '42', dimensionValueType: 'INT' },
				{
					Name: 'activity_id',
					Value: '08f83f6cbd48b966f8211745e9e46b20fd9f9060',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'athlete',
					Value: 'Lena Kråkevik H.',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'activity_type',
					Value: 'WeightTraining',
					dimensionValueType: 'VARCHAR',
				},
			],
			MeasureName: 'nodistance_points',
			MeasureValue: '3934.722222222222',
			MeasureValueType: 'DOUBLE',
			Time: currentTime.getTime().toString(),
		})
		expect(result).toContainEqual({
			Dimensions: [
				{ Name: 'Team', Value: '42', dimensionValueType: 'INT' },
				{
					Name: 'activity_id',
					Value: '08f83f6cbd48b966f8211745e9e46b20fd9f9060',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'athlete',
					Value: 'Lena Kråkevik H.',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'activity_type',
					Value: 'WeightTraining',
					dimensionValueType: 'VARCHAR',
				},
			],
			MeasureName: 'distance',
			MeasureValue: '0',
			MeasureValueType: 'DOUBLE',
			Time: currentTime.getTime().toString(),
		})
	})
})
