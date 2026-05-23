/// <reference path="../.astro/types.d.ts" />

import type { Locale } from '@utils/i18n';

declare global {
	namespace App {
		interface Locals {
			locale: Locale;
		}
	}
}

export {};
