import { App } from 'aws-cdk-lib'
import {
	prepareStravaArchiveLambdas,
	type StravaArchiveLambdas,
} from 'cdk/lambdas'
import { StravaArchiveStack } from './StravaArchiveStack.js'
import pJSON from '../package.json'
import { ensureGitHubOIDCProvider } from '../cdk/ensureGitHubOIDCProvider.js'
import { IAMClient } from '@aws-sdk/client-iam'

const repoUrl = new URL(pJSON.repository.url)
const repository = {
	owner: repoUrl.pathname.split('/')[1] ?? 'Lenakh97',
	repo:
		repoUrl.pathname.split('/')[2]?.replace(/\.git$/, '') ??
		'Strava-Timestream-archive',
}

const iam = new IAMClient({})

export type Repository = {
	owner: string
	repo: string
}

export class StravaArchiveApp extends App {
	public constructor({
		lambdas,
		repository,
		gitHubOIDCProviderArn,
		version,
	}: {
		lambdas: StravaArchiveLambdas
		repository: Repository
		gitHubOIDCProviderArn: string
		version: string
	}) {
		super({
			context: {
				version,
			},
		})
		new StravaArchiveStack(this, {
			lambdas,
			repository,
			gitHubOIDCProviderArn,
		})
	}
}

new StravaArchiveApp({
	lambdas: await prepareStravaArchiveLambdas(),
	repository,
	gitHubOIDCProviderArn: await ensureGitHubOIDCProvider({
		iam,
	}),
	version: process.env.VERSION ?? '0.0.0-development',
})
