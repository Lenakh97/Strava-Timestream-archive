import pjson from '../package.json'
import type { PackedLambda } from './helper/packLambda.js'
import { packLambdaFromPath } from './helper/packLambdaFromPath.js'
import { packLayer } from './helper/packLayer.js'

export type StravaArchiveLambdas = {
	layerZipFileName: string
	lambdas: {
		storeActivities: PackedLambda
		summaryAPI: PackedLambda
		sendEmailWithTopDistAndTime: PackedLambda
		sendEmailWithRandomWinners: PackedLambda
	}
}

export const prepareStravaArchiveLambdas =
	async (): Promise<StravaArchiveLambdas> => ({
		layerZipFileName: (
			await packLayer({
				id: 'strava-lambda-dependenices',
				dependencies: Object.keys(pjson.dependencies),
			})
		).layerZipFile,
		lambdas: {
			storeActivities: await packLambdaFromPath(
				'storeActivities',
				'lambdas/storeActivities/storeActivities.ts',
			),
			summaryAPI: await packLambdaFromPath(
				'summaryAPI',
				'lambdas/summaryAPI.ts',
			),
			sendEmailWithTopDistAndTime: await packLambdaFromPath(
				'sendEmailWithTopDistAndTime',
				'lambdas/sendEmail/sendEmailWithTopDistAndTime.ts',
			),
			sendEmailWithRandomWinners: await packLambdaFromPath(
				'sendEmailWithRandomWinners',
				'lambdas/sendEmail/sendEmailWithRandomWinners.ts',
			),
		},
	})
