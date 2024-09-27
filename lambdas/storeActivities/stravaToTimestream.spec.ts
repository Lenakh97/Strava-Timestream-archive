import { stravaToTimestream } from './stravaToTimestream.js'

describe('stravaToTimestream', () => {
	it('should convert Strava activity data to Timestream records', () => {
		const currentTime = new Date('2024-09-19T11:45:56.677Z')
		const result = stravaToTimestream(
			42,
			currentTime,
			[
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
					sport_type: 'MountainBikeRide',
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
			],
			[],
		)
		expect(result).toContainEqual({
			Dimensions: [
				{ Name: 'Team', Value: '42', dimensionValueType: 'INT' },
				{
					Name: 'activity_id',
					Value: '04d4ccf32c6efb210928f6be665481d546f9b4b0',
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
					Value: 'd44a4b2027fd9c1f162e926d613fd3fc0ca926d7',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'athlete',
					Value: 'Alex L.',
					dimensionValueType: 'VARCHAR',
				},
				{
					Name: 'activity_type',
					Value: 'MountainBikeRide',
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
					Value: '7eaeb922b688492c4ee0f61f509453a4ba544056',
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
					Value: '7eaeb922b688492c4ee0f61f509453a4ba544056',
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
