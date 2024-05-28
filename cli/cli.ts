import chalk from 'chalk'
import { program } from 'commander'
import psjon from '../package.json'
import type { CommandDefinition } from './commands/CommandDefinition.js'
import { upsertRecordsCommand } from './commands/upsertRecord.js'
import { TimestreamWriteClient } from '@aws-sdk/client-timestream-write'
import { fromEnv } from '@nordicsemiconductor/from-env'

const tsw = new TimestreamWriteClient({})
const { tableInfo } = fromEnv({
	tableInfo: 'TABLE_INFO', // db-R3SpgYH1TweT|table-ljo9vXM2L1Ud
})(process.env)

const [dbName, tableName] = tableInfo.split('|') as [string, string]

const die = (err: Error, origin: any) => {
	console.error(`An unhandled exception occured!`)
	console.error(`Exception origin: ${JSON.stringify(origin)}`)
	console.error(err)
	process.exit(1)
}

process.on('uncaughtException', die)
process.on('unhandledRejection', die)

console.log('')

const CLI = async () => {
	program.description(
		`Strava-Timestream-Archive ${psjon.version} Command Line Interface`,
	)
	program.version(psjon.version)

	const commands: CommandDefinition[] = [
		upsertRecordsCommand({ tsw, dbName, tableName }),
	]

	let ran = false
	commands.forEach(({ command, action, help, options }) => {
		const cmd = program.command(command)
		cmd
			.action(async (...args) => {
				try {
					ran = true
					await action(...args)
				} catch (error) {
					console.error(
						chalk.red.inverse(' ERROR '),
						chalk.red(`${command} failed!`),
					)
					console.error(chalk.red.inverse(' ERROR '), chalk.red(error))
					process.exit(1)
				}
			})
			.on('--help', () => {
				console.log('')
				console.log(chalk.yellow(help))
				console.log('')
			})
		if (options) {
			options.forEach(({ flags, description, defaultValue }) =>
				cmd.option(flags, description, defaultValue),
			)
		}
	})

	program.parse(process.argv)

	if (!ran) {
		program.outputHelp(chalk.yellow)
		throw new Error('No command selected!')
	}
}

CLI().catch((err) => {
	console.error(chalk.red(err))
	process.exit(1)
})
