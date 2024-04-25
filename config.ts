export const StravaChallengeWeeks = [15, 16, 17, 18]
export const fallBackStartTimestamp = new Date(
	'2023-03-27T00:00:00',
).toISOString()
export const startDateString = '2023-04-17 00:00:00'
export const distanceGoal = 15726.7 //last years results

//Headcount from spring 2023
export const officeHeadcount = {
	'1174164': { memberCount: 301 }, //Finland
	'1174165': { memberCount: 133 }, //Poland
	'1174166': { memberCount: 207 }, //Europe
	'1174167': { memberCount: 237 }, //APAC
	'1174168': { memberCount: 75 }, //USA
	'1174140': { memberCount: 492 }, //Trondheim
	'1174791': { memberCount: 500 }, //Omega
	'1174162': { memberCount: 204 }, //Oslo
}
/*
Email to use for sending and receiving random winners 
and the final winner in the end.
*/
export const sendEmail = {
	toAddress: 'lena.haraldseid@nordicsemi.no',
	fromAddress: 'lenaharaldseid@gmail.com',
}
