import { App } from 'aws-cdk-lib'
import type { StravaArchiveLambdas } from 'cdk/lambdas'
import { StravaArchiveStack } from './StravaArchiveStack.js'

export class StravaArchiveApp extends App {
	public constructor({ lambdas }: { lambdas: StravaArchiveLambdas }) {
		super()
		new StravaArchiveStack(this, {
			lambdas,
		})
	}
}
