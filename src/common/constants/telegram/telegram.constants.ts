export const TELEGRAM_API = {
	apiId: parseInt(process.env.TELEGRAM_API_ID || '', 10),
	apiHash: process.env.TELEGRAM_API_HASH || '',
};