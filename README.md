## Testing

Create a Tinmestream Database and Table before running the tests:

```bash
export TEST_DB_NAME=TestStravaDatabase
export TEST_TABLE_NAME=TestStravaTable

aws timestream-write create-database --database-name $TEST_DB_NAME
aws timestream-write create-table --database-name $TEST_DB_NAME --table-name $TEST_TABLE_NAME
```
