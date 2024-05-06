export const StravaChallengeWeeks = [16, 17, 18, 19]
export const fallBackStartTimestamp = new Date(
	'2023-03-27T00:00:00',
).toISOString()
export const startDateString = '2023-04-17 00:00:00'
export const distanceGoal = 15726.7 //last years results

//Headcount from spring 2023
export const officeHeadcount = {
	'1174164': { memberCount: 307 }, //Finland
	'1174165': { memberCount: 109 }, //Poland
	'1174166': { memberCount: 124 }, //Europe
	'1174167': { memberCount: 212 }, //APAC
	'1174168': { memberCount: 72 }, //USA
	'1174140': { memberCount: 407 }, //Trondheim
	'1174791': { memberCount: 500 }, //Omega
	'1174162': { memberCount: 174 }, //Oslo
}
/*
Email to use for sending and receiving random winners 
and the final winner in the end.
*/
export const sendEmail = {
	toAddress: 'lena.haraldseid@nordicsemi.no',
	fromAddress: 'lenaharaldseid@gmail.com',
}

export const TEST_DB_NAME = 'TestStravaDatabase'
export const TEST_TABLE_NAME = 'TestStravaTable'
