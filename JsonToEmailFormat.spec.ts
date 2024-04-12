import { JsonToEmailFormat } from './JsonToEmailFormat.js'
import { teamList } from './lambdas/teamList.js'

describe('getRandomWeeklyWinners()', () => {
	const string = {
		'1174791': [
			'Synne A.',
			'Freider Engstrøm F.',
			'Martine Grøttum E.',
			'Helene L.',
			'Kjartan V.',
		],
		'1174162': ['Gregers R.', 'vetle B.', 'Lee F.', 'David D.'],
		'1174140': ['Lee F.', 'Tore A.', 'Jovy S.', 'Kyrre G.', 'David Wæraas B.'],
		'1174164': ['Kirsi-Marja L.', 'Tiago M.', 'Risto H.', 'Lee F.', 'Petri K.'],
		'1174167': ['Lee F.', 'Wen B.', 'Elydjah C.'],
		'1174168': ['Lee F.'],
		'1174166': ['Lee F.'],
		'1174165': [
			'Andrzej B.',
			'Adam S.',
			'Marcin G.',
			'Hubert M.',
			'Jędrzej C.',
		],
	}
	it('should make string pretty for email sending', async () => {
		// Fill Timestream table with test data
		const expectedString =
			'<b>Trondheim</b><br>Lee F.<br>Tore A.<br>Jovy S.<br>Kyrre G.<br>David Wæraas B.<br><b>Oslo</b><br>Gregers R.<br>vetle B.<br>Lee F.<br>David D.<br><b>Finland</b><br>Kirsi-Marja L.<br>Tiago M.<br>Risto H.<br>Lee F.<br>Petri K.<br><b>Poland</b><br>Andrzej B.<br>Adam S.<br>Marcin G.<br>Hubert M.<br>Jędrzej C.<br><b>Europe</b><br>Lee F.<br><b>APAC</b><br>Lee F.<br>Wen B.<br>Elydjah C.<br><b>USA</b><br>Lee F.<br><b>Omega</b><br>Synne A.<br>Freider Engstrøm F.<br>Martine Grøttum E.<br>Helene L.<br>Kjartan V.<br>'
		expect(JsonToEmailFormat(string, teamList)).toEqual(expectedString)
	})
})
