import got from 'got';
import xml2js from 'xml2js-es6-promise';
import cleanApiData from './clean-api-data';
import cleanListData from './clean-list-data';

const debug = require('debug')('popura:request');
const pkg = require('../../package.json');

const userAgent = `popura/${pkg.version} (https://github.com/lubien/popura)`;

/**
 * HTTP Request a page from MAL
 *
 * @param  {string} - Basic Authentication token
 * @param  {string} url = '/'
 * @param  {object} opts = {} - Request options
 * @return {Promise} - Resolves to the raw request body
 */
export function requestRaw(authToken, url = '/', opts = {}) {
	debug(
		`Requesting ${url} with. Use auth: ${Boolean(authToken)}. Query`,
		opts.query
	);
	return got(`http://myanimelist.net${url}`, Object.assign(opts, {
		headers: {
			Authorization: `Basic ${authToken}`,
			'User-Agent': userAgent,
		},
	}));
}

// TODO: function requestHtml()

/**
 * Request MAL's API XML, then parses as JSON and clean it
 *
 * @param  {string} - Basic Authentication token
 * @param  {string} url = '/'
 * @param  {object} opts = {} - Request options
 * @return {Promise} - Resolves to a parsed as JSON and
 * cleaned version of MAL's API response
 */
export function requestApi(authToken, url = '/', opts = {}) {
	if (!authToken) {
		debug('Not authenticated');
		throw new Error('Must have username and password set to access the API');
	}

	return requestRaw(authToken, `/api${url}`, opts)
		.then(res => xml2js(res.body))
		.then(parsedXml => Promise.resolve(cleanApiData(parsedXml)));
}

/**
 * Request an user anime/manga list
 *
 * @param  {string} authToken - Basic Authentication token
 * @param  {string} type - List type: 'anime' or 'manga'
 * @param  {string} username - MAL username
 * @return {Promise} - Resolves to {myinfo: {...}, list: [...]}
 * where myinfo constains info about the user and the list.
 */
export function requestList(authToken, type, username) {
	debug(`Requesting ${type}list of ${username}`);
	return requestRaw(authToken, '/malappinfo.php', {
		query: {
			u: username,
			type,
		},
	})
		.then(res => xml2js(res.body))
		.then(parsedXml => {
			if (parsedXml.myanimelist.error) {
				throw new Error(parsedXml.myanimelist.error);
			}
			return Promise.resolve(parsedXml);
		})
		.then(parsedXml => Promise.resolve(cleanListData(parsedXml)));
}

/**
 * Sends XML to the MAL API
 *
 * @param  {string} - Basic Authentication token
 * @param  {string} url = '/'
 * @param  {object} opts = {} - Request options
 * @return {Promise} - Resolves to the raw request.body
 */
export function postXml(authToken, url = '/', opts = {}) {
	debug(`Posting in MAL's API`);
	return got(`http://myanimelist.net/api${url}`, Object.assign(opts, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${authToken}`,
			'User-Agent': userAgent,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}))
		.then(({body}) => Promise.resolve(body));
}
