import { JsonToEmailFormat } from './JsonToEmailFormat.js'
import { teamList } from './lambdas/teamList.js'

describe('getRandomWeeklyWinners()', () => {
	const string = {
		'232813': [
			'Synne A.',
			'Freider Engstrøm F.',
			'Martine Grøttum E.',
			'Helene L.',
			'Kjartan V.',
		],
		'838200': ['Gregers R.', 'vetle B.', 'Lee F.', 'David D.'],
		'838203': ['Lee F.', 'Tore A.', 'Jovy S.', 'Kyrre G.', 'David Wæraas B.'],
		'838205': ['Kirsi-Marja L.', 'Tiago M.', 'Risto H.', 'Lee F.', 'Petri K.'],
		'838207': ['Lee F.', 'Wen B.', 'Elydjah C.'],
		'838209': ['Lee F.'],
		'838211': ['Lee F.'],
		'982093': ['Andrzej B.', 'Adam S.', 'Marcin G.', 'Hubert M.', 'Jędrzej C.'],
	}
	it('should make string pretty for email sending', async () => {
		// Fill Timestream table with test data

		const expectedString =
			'<b>Omega</b><br>Synne A.<br>Freider Engstrøm F.<br>Martine Grøttum E.<br>Helene L.<br>Kjartan V.<br><b>Oslo</b><br>Gregers R.<br>vetle B.<br>Lee F.<br>David D.<br><b>Trondheim</b><br>Lee F.<br>Tore A.<br>Jovy S.<br>Kyrre G.<br>David Wæraas B.<br><b>Finland</b><br>Kirsi-Marja L.<br>Tiago M.<br>Risto H.<br>Lee F.<br>Petri K.<br><b>APAC</b><br>Lee F.<br>Wen B.<br>Elydjah C.<br><b>USA</b><br>Lee F.<br><b>Europe</b><br>Lee F.<br><b>Poland</b><br>Andrzej B.<br>Adam S.<br>Marcin G.<br>Hubert M.<br>Jędrzej C.<br>'
		expect(JsonToEmailFormat(string, teamList)).toEqual(expectedString)
	})
})
