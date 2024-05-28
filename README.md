## Testing

Create a Tinmestream Database and Table before running the tests:

```bash
export TEST_DB_NAME=TestStravaDatabase
export TEST_TABLE_NAME=TestStravaTable

aws timestream-write create-database --database-name $TEST_DB_NAME
aws timestream-write create-table --database-name $TEST_DB_NAME --table-name $TEST_TABLE_NAME
```

## Deploy to an AWS account

Configure the Strava API credentials

```bash
aws ssm put-parameter --name /strava/clientId --type String --value <Strava Client ID>
aws ssm put-parameter --name /strava/clientSecret --type String --value <Strava Client Secret>
aws ssm put-parameter --name /strava/refreshToken --type String --value <Strava Refresh Token>
```

```bash
npx cdk bootstrap # only needed once
npx cdk deploy
```

## Change records in Timestream

The records in Timestream can be changed by using the following command:

```bash
./cli.sh Upsert-activity-record <Team> <activity_id> <athlete> <activity_type> <Time> <MeasureName> <MeasureValue> <MeasureValueType> <Version>
```

By using this command you can change the values of either `elapsed_time`,
`distance`, `nodistance_points` or `elevation`.

Examples of the parameters can be found
[here](https://github.com/Lenakh97/Strava-Timestream-archive/blob/saga/cli/commands/upsertRecord.ts).
The table needs to have `Magnetic store writes` enabled if records are in the
magnetic store.
