// import typography from '@tailwindcss/typography';
// import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

import { contentPath } from '@skeletonlabs/skeleton/plugin';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}', contentPath(import.meta.url, 'svelte')],
	darkMode: 'selector',
	theme: {
		extend: {}
	}
} satisfies Config;
