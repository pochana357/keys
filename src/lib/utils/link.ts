import type { Ability } from '$lib/api/wclTypes';

export function addLink(content: string, url: string) {
	return `<a href="${url}" target="_blank">${content}</a>`;
}
export function addSpellLink(content: string, spellId: number) {
	return addLink(content, `https://www.wowhead.com/spell=${spellId}`);
}
export function ability2img(ability: Ability, classes = '') {
	const classes_ = `w-5 max-w-none ${classes}`;
	const img = `<img class="${classes_}" src="https://assets.rpglogs.com/img/warcraft/abilities/${ability.abilityIcon}" alt="${ability.name}" />`;
	return addSpellLink(img, ability.guid);
}
