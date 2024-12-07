<script lang="ts">
	import type { CastEvent } from '$lib/api/wclTypes';
	import { castBlackList, castDict } from '$lib/appData';
	import Timeline from '$lib/Timeline.svelte';
	import ClassUtils from '$lib/utils/ClassUtils';
	import { ability2img } from '$lib/utils/link';

	type Props = {
		castEventsBySource: CastEvent[];
		castEventsByTarget?: CastEvent[];
		showMinor: boolean;
		showReceived: boolean;
		width: number;
		cursor: number | null;
	};
	let {
		castEventsBySource,
		castEventsByTarget = [],
		showMinor,
		showReceived,
		width,
		cursor = $bindable(null)
	}: Props = $props();

	const detailsCreator = (event: CastEvent) =>
		`${ClassUtils.formatUnit(event.source)}` +
		(event.target ? ` ▶ ${ClassUtils.formatUnit(event.target)}` : '');

	const event2icon = (event: CastEvent, classes = '') => ({
		timestamp: event.timestamp,
		content: ability2img(event.ability, classes),
		details: `${event.ability.name} (#${event.ability.guid})<br>` + detailsCreator(event)
	});

	const isMinor = (event: CastEvent) => castDict[event.ability.guid]?.minor ?? false;

	let majorCastIcons = $derived(
		castEventsBySource.filter((event) => !isMinor(event)).map((event) => event2icon(event))
	);
	let minorCastIcons = $derived(
		castEventsBySource.filter((event) => isMinor(event)).map((event) => event2icon(event))
	);
	let receivedCastIcons = $derived(
		castEventsByTarget
			.filter((event) => !castBlackList.AoEHeals.includes(event.ability.guid))
			.map((event) => event2icon(event, 'grayscale-[50%]'))
	);
</script>

<div class="w-full bg-slate-700" style:width="{width}px">
	<Timeline datatype="spellIcon" data={{ icons: majorCastIcons }} bind:cursor />
</div>

{#if showMinor && minorCastIcons.length > 0}
	<div class="w-full bg-slate-600" style:width="{width}px">
		<Timeline datatype="spellIcon" data={{ icons: minorCastIcons }} bind:cursor />
	</div>
{/if}

{#if showReceived && receivedCastIcons.length > 0}
	<div class="w-full bg-slate-500" style:width="{width}px">
		<Timeline datatype="spellIcon" data={{ icons: receivedCastIcons }} bind:cursor />
	</div>
{/if}
