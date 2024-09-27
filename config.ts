export const StravaChallengeWeeks = [20, 21, 22, 23]
export const fallBackStartTimestamp = new Date(
	'2024-05-13T00:00:00',
).toISOString()
export const startDateString = '2024-05-13 00:00:00'
export const distanceGoal = 23202 //last years results

//Headcount from spring 2024
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

export const teamTimezoneDiff = {
	'1174164': { timezoneDiff: 3 }, //Finland
	'1174165': { timezoneDiff: 2 }, //Poland
	'1174166': { timezoneDiff: 2 }, //Europe
	'1174167': { timezoneDiff: 8 }, //APAC
	'1174168': { timezoneDiff: -7 }, //USA
	'1174140': { timezoneDiff: 2 }, //Trondheim
	'1174791': { timezoneDiff: 2 }, //Omega
	'1174162': { timezoneDiff: 2 }, //Oslo
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
