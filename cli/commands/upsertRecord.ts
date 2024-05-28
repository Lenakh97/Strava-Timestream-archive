import {
	MeasureValueType,
	TimestreamWriteClient,
	WriteRecordsCommand,
	_Record,
} from '@aws-sdk/client-timestream-write'
import type { CommandDefinition } from './CommandDefinition.js'

export const upsertRecordsCommand = ({
	tsw,
	dbName,
	tableName,
}: {
	tsw: TimestreamWriteClient
	dbName: string
	tableName: string
}): CommandDefinition => ({
	command:
		'Upsert-activity-record <Team> <activity_id> <athlete> <activity_type> <Time> <MeasureName> <MeasureValue> <MeasureValueType> <Version>',
	action: async (
		Team: string, //e.g. 1174140
		activity_id: string, //e.g. fff264da8fee6e3edc91ee5d8cf055fb8921ab1c
		athlete: string, //e.g. Ola N.
		activity_type: string, //e.g. Walk
		Time: string, //e.g. 2024-05-25 08:21:02.055000000
		MeasureName: string, // elapsed_time | distance | nodistance_points | elevation
		MeasureValue: string, // e.g. 1234
		MeasureValueType: MeasureValueType, //e.g. DOUBLE
		Version: number, //e.g 2
	) => {
		const record: _Record[] = [
			{
				Dimensions: [
					{
						Name: 'Team',
						Value: Team,
						DimensionValueType: 'VARCHAR',
					},
					{
						Name: 'activity_id',
						Value: activity_id,
						DimensionValueType: 'VARCHAR',
					},
					{
						Name: 'athlete',
						Value: athlete,
						DimensionValueType: 'VARCHAR',
					},
					{
						Name: 'activity_type',
						Value: activity_type,
						DimensionValueType: 'VARCHAR',
					},
				],
				MeasureName,
				MeasureValue,
				MeasureValueType,
				Time: new Date(Time).getTime().toString(),
				Version: Number(Version),
			},
		]
		try {
			await tsw.send(
				new WriteRecordsCommand({
					DatabaseName: dbName,
					TableName: tableName,
					Records: record,
				}),
			)
			console.log(JSON.stringify({ written: record }, null, 2))
		} catch (error) {
			console.error('Error:', error)
		}
	},
	help: 'Upsert a Record',
})
