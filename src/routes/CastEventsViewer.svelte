<script lang="ts">
	import type { BuffEvent, CastEvent, DebuffEvent } from '$lib/api/wclTypes';
	import { castBlackList, castDict, spelllikeBuffs, spelllikeDebuffs } from '$lib/appData';
	import Timeline from '$lib/Timeline.svelte';
	import ClassUtils from '$lib/utils/ClassUtils';
	import { ability2img } from '$lib/utils/link';

	type Props = {
		castEventsBySource: CastEvent[];
		castEventsByTarget?: CastEvent[];
		buffEvents?: BuffEvent[];
		debuffEvents?: DebuffEvent[];
		showMinor: boolean;
		showReceived: boolean;
		width: number;
		cursor: number | null;
		options: {
			referenceTime?: number;
			offsetX?: (timestamp: number) => number;
		};
	};
	let {
		castEventsBySource,
		castEventsByTarget = [],
		buffEvents = [],
		debuffEvents = [],
		showMinor,
		showReceived,
		width,
		cursor = $bindable(null),
		options = {}
	}: Props = $props();

	let referenceTime = $derived(options.referenceTime ?? 0);

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

	let spelllikeBuffIcons = $derived(
		buffEvents
			.filter(
				(event) =>
					spelllikeBuffs[event.ability.guid] !== undefined &&
					['applybuff', 'applybuffstack', 'refreshbuff'].includes(event.type)
			)
			.map((event) => event2icon(event))
	);

	let spelllikeDebuffIcons = $derived(
		debuffEvents
			.filter(
				(event) =>
					spelllikeDebuffs[event.ability.guid] !== undefined &&
					['applydebuff', 'applydebuffstack', 'refreshdebuff'].includes(event.type)
			)
			.map((event) => event2icon(event))
	);

	let minorIcons = $derived.by(() => {
		const icons = [...minorCastIcons, ...spelllikeBuffIcons, ...spelllikeDebuffIcons];
		icons.sort((a, b) => a.timestamp - b.timestamp);
		return icons;
	});
</script>

<div class="w-full bg-slate-700" style:width="{width}px">
	<Timeline
		datatype="spellIcon"
		icons={majorCastIcons}
		options={{ referenceTime, offsetX: options.offsetX }}
		bind:cursor
	/>
</div>

{#if showMinor && minorIcons.length > 0}
	<div class="w-full bg-slate-600" style:width="{width}px">
		<Timeline
			datatype="spellIcon"
			icons={minorIcons}
			options={{ referenceTime, offsetX: options.offsetX }}
			bind:cursor
		/>
	</div>
{/if}

{#if showReceived && receivedCastIcons.length > 0}
	<div class="w-full bg-slate-500" style:width="{width}px">
		<Timeline
			datatype="spellIcon"
			icons={receivedCastIcons}
			options={{ referenceTime, offsetX: options.offsetX }}
			bind:cursor
		/>
	</div>
{/if}
