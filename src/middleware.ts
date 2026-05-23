// Astro middleware: runs on every SSR request.
//
// Responsibilities:
//   1. On root URL ('/'), redirect to the user's preferred locale prefix:
//      - explicit `nn_locale` cookie (from LangSwitcher) wins
//      - else negotiate from Accept-Language
//      - else stay on '/' (the English default)
//   2. Expose the active locale on `Astro.locals.locale` so pages and the
//      Layout can read it without re-parsing the URL.
//
// Static-prerendered pages are served straight from disk and never invoke
// this middleware — that's fine because their locale is already encoded in
// the URL by Astro's i18n routing config.

import type { MiddlewareHandler } from 'astro';
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE,
	extractLocaleFromPath,
	isLocale,
	negotiateLocale,
	pathFor,
	type Locale
} from '@utils/i18n';

export const onRequest: MiddlewareHandler = async (context, next) => {
	const url = new URL(context.request.url);

	// Only do redirect logic on the bare root ('/' or '' — never on '/projects'
	// etc., since those have explicit locale prefixes already).
	if (url.pathname === '/' || url.pathname === '') {
		const cookieLocale = context.cookies.get(LOCALE_COOKIE)?.value;
		let target: Locale | null = isLocale(cookieLocale) ? cookieLocale : null;

		if (!target) {
			target = negotiateLocale(context.request.headers.get('accept-language'));
		}

		if (target && target !== DEFAULT_LOCALE) {
			return context.redirect(pathFor(target, '/'), 302);
		}
	}

	// Make the active locale available to pages.
	const locale = extractLocaleFromPath(url.pathname);
	context.locals.locale = locale;

	return next();
};
