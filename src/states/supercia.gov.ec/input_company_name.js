import make_state from '../makeState.js';
import waitUntilRequestDone from '../../utils/waitForNetworkIdle.js'
import recognizeCaptchan from '../../utils/recognizeNumberCaptchan.js'
import { busqueda_de_companias } from '../../urls.js'
import options from '../../options.js'

// set debugging 
let debugging = options.debugging;

// condition for entering input name state
const input_name_condition = async browser => 
		// if it dow not have a page yet, and the page is at consulta principal
		( ( await browser.pages() ).length === 1 && 
				(( await browser.pages() )[0].url() === busqueda_de_companias )
		)

/* scraps a id from a single company name */
const input_name_script = async (browser, name, log) => {
		log(`Starting scrap of ${name}...`)
		// for page to load
		let [ page ] = await browser.pages();
		//await waitUntilRequestDone(page, 2000)
		// get the radion 
		let [ radio_el ] = await page.$x('//*[text()="Nombre"]/..');

		// click on the name radio
		if(radio_el) await radio_el.click();
		else throw new Error('Could not get name radion selector element')

		// get the main text input
		let [ text_input ] = 
				await page.$x('//input[@id="frmBusquedaCompanias:parametroBusqueda_input"]')

		// logged
		if(text_input) debugging && log("Got search comany name textInput element")

		// clear text input
		await page.evaluate(input => input.value = "", text_input);
		// awai for browser to be done
		await waitUntilRequestDone(page, 1000)
		// type name of company
		debugging && log("Typing the name of the company")
		await text_input.type(name, {delay: 10});
		await waitUntilRequestDone(page, 1000)
		debugging && log("Wating for sudgestions")

		// wait for sugeestions
		await page.waitForXPath('//ul[@class="ui-autocomplete-items ui-autocomplete-list ui-widget-content ui-widget ui-corner-all ui-helper-reset"]')

		// select suggestion
		await page.keyboard.press('Enter');

		// wait until for a little
		await waitUntilRequestDone(page, 2000);

		// wait until captchan appears
		let captchan = 
				await page.waitForXPath('//img[@id="frmBusquedaCompanias:captchaImage"]');

		// take screenshot of captchan
		let captchan_buffer = await captchan.screenshot();

		// recognize the captchan
		debugging && log("Recognizing captchan...")
		let captchan_text = await recognizeCaptchan(captchan_buffer);
		log("Recognized captchan as: " + captchan_text)

		// get the captchan input 
		let [ captchan_input ] = 
				await page.$x('//input[@id="frmBusquedaCompanias:captcha"]')  

		// input captchan numbers
		await captchan_input.type(captchan_text, {delay: 130});

		
		// getting the search button
		debugging && log("getting comapny search button..")
		let [ search_button ] =
				await page.$x('//button[@id="frmBusquedaCompanias:btnConsultarCompania"]')

		// click seach button
		debugging && log("clicking search_button...")
		await search_button.click({delay: 1});

		// wait until new page loads
		debugging && log("waiting for new page")
		await waitUntilRequestDone(page, 2000);
}

// make state
export default make_state( 
		input_name_condition,
		input_name_script
)
