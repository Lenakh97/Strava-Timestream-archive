import type { _Record } from '@aws-sdk/client-timestream-write'
import { createHash } from 'node:crypto'

const checksum = (activity: StravaActivity): string => {
	const shasum = createHash('sha1')
	shasum.update(JSON.stringify(activity))
	return shasum.digest('hex')
}

export type StravaActivity = {
	resource_state: number // 2
	athlete: {
		resource_state: number // 2
		firstname: string // 'Eduardo'
		lastname: string // 'M.'
	}
	name: string // 'Málaga - Ardales '
	distance: number // 52160.9
	moving_time: number // 11401
	elapsed_time: number // 15907
	total_elevation_gain: number // 781
	type: string // 'Ride'
	sport_type: string // 'Ride'
	workout_type?: number | null // 10
}

export const stravaToTimestream = (
	team: number,
	currentTime: Date,
	data: StravaActivity[],
): _Record[] => {
	const records: _Record[] = []
	for (const activity of data) {
		const dimension = [
			{ Name: 'Team', Value: String(team), dimensionValueType: 'INT' },
			{
				Name: 'activity_id',
				Value: checksum(activity),
				dimensionValueType: 'VARCHAR',
			},
			{
				Name: 'athlete',
				Value: `${activity.athlete.firstname} ${activity.athlete.lastname}`,
				dimensionValueType: 'VARCHAR',
			},
			{
				Name: 'activity_type',
				Value: activity.sport_type,
				dimensionValueType: 'VARCHAR',
			},
		]
		//if distance = 0 the activity is without distance and the athlete should get 5 'km points' per hour of activity.
		let noDistancePoints = 0
		if (
			activity.distance === 0.0 ||
			activity.sport_type === 'Snowboard' ||
			activity.sport_type === 'AlpineSki' ||
			activity.sport_type == 'Golf'
		) {
			const hours = activity.elapsed_time / 3600
			noDistancePoints = 5 * hours * 1000
		}
		records.push({
			Time: currentTime.getTime().toString(),
			Dimensions: dimension,
			MeasureName: 'nodistance_points',
			MeasureValue: String(noDistancePoints),
			MeasureValueType: 'DOUBLE',
		})
		records.push({
			Time: currentTime.getTime().toString(),
			Dimensions: dimension,
			MeasureName: 'distance',
			MeasureValue: String(activity.distance),
			MeasureValueType: 'DOUBLE',
		})
		records.push({
			Time: currentTime.getTime().toString(),
			Dimensions: dimension,
			MeasureName: 'elapsed_time',
			MeasureValue: String(activity.elapsed_time),
			MeasureValueType: 'DOUBLE',
		})
		records.push({
			Time: currentTime.getTime().toString(),
			Dimensions: dimension,
			MeasureName: 'elevation',
			MeasureValue: String(activity.total_elevation_gain),
			MeasureValueType: 'DOUBLE',
		})
	}

	return records
}
