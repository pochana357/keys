<script lang="ts">
	import type EventsLumped from '$lib/api/EventsLumped.svelte';
	import type { Ability, EventRawBase, GeneralEventRaw } from '$lib/api/wclTypes';
	import { AppState } from '$lib/AppState';
	import Timeline, { type Icon } from '$lib/Timeline.svelte';
	import { formatTime } from '$lib/utils/utils';
	import ClassUtils from '$lib/utils/ClassUtils';
	import { ability2img } from '$lib/utils/link';
	import DamageEventsViewer from './DamageEventsViewer.svelte';
	import CastEventsViewer from './CastEventsViewer.svelte';
	import type { SvelteMap } from 'svelte/reactivity';

	type Props = {
		events: EventsLumped;
		options: {
			pxPerSec?: number;
			showMinor?: boolean;
			showReceived?: boolean;
			referenceTime?: number;
		};
		buffDict: SvelteMap<number, Ability>;
	};
	let { events, options = {}, buffDict }: Props = $props();
	let cursor: number | null = $state(0);
	const timeTick = 10000;
	const numTimeTicks = $derived(Math.ceil((events.endTime - events.startTime) / timeTick));

	let referenceTime = $derived(options.referenceTime ?? events.startTime);

	function timeTickCreator(i: number): Icon<string> {
		return {
			timestamp: events.startTime + i * timeTick,
			data: formatTime(events.startTime - referenceTime + i * 10000, 0, 0)
		};
	}
	const timeTicks = $derived([...Array(numTimeTicks + 1).keys()].map(timeTickCreator));

	function event2icon<T extends EventRawBase>(
		event: T,
		detailsCreator: (event: T) => string,
		classes = ''
	) {
		return {
			timestamp: event.timestamp,
			content: ability2img(event.ability, classes),
			details: `${event.ability.name} (#${event.ability.guid})<br>` + detailsCreator(event)
		};
	}

	let showMinor = $derived(options.showMinor ?? AppState.defaultSettings.showMinor);
	let showReceived = $derived(options.showReceived ?? AppState.defaultSettings.showReceived);
	let pxPerSec = $derived(options.pxPerSec ?? AppState.defaultSettings.pxPerSec);
	const offsetX = (timestamp: number) => ((timestamp - events.startTime) / 1000.0) * pxPerSec;
	let width = $derived(((numTimeTicks * timeTick) / 1000.0) * pxPerSec);

	function filterEvents<T extends GeneralEventRaw>(
		events: T[],
		playerId: { source?: number; target?: number }
	) {
		const filtered = playerId.source
			? events.filter((e) => e.source?.id === playerId.source)
			: events;
		return playerId.target ? filtered.filter((e) => e.target?.id === playerId.target) : filtered;
	}

	function partitionEventsByPlayer<T extends GeneralEventRaw>(events: T[]) {
		const bySource: { [id: number]: T[] } = {};
		const byTarget: { [id: number]: T[] } = {};
		for (const e of events) {
			if (e.source) {
				if (!bySource[e.source.id]) bySource[e.source.id] = [];
				bySource[e.source.id].push(e);
			}
			if (e.target) {
				if (!byTarget[e.target.id]) byTarget[e.target.id] = [];
				byTarget[e.target.id].push(e);
			}
		}
		return { bySource, byTarget };
	}

	const damageEventsPartitioned = $derived(partitionEventsByPlayer(events.damages));
	const castEventsPartitioned = $derived(partitionEventsByPlayer(events.casts));
	const buffEventsPartitioned = $derived(partitionEventsByPlayer(events.buffs));
	const debuffEventsPartitioned = $derived(partitionEventsByPlayer(events.debuffs));
</script>

{#snippet timeTickContentRenderer(timeTick: Icon<string>)}
	{timeTick.data}
{/snippet}
<div class="lr-2 w-max py-2 pl-1">
	<div class="relative">
		{#each timeTicks as tick (tick.timestamp)}
			<div
				style:width="1px"
				style:left="{offsetX(tick.timestamp)}px"
				class="absolute h-full bg-gray-500"
			></div>
		{/each}
		{#if cursor}
			<div style:width="1px" style:left="{cursor}px" class="absolute h-full bg-red-500"></div>
		{/if}
		<Timeline
			datatype="text"
			icons={timeTicks}
			contentRenderer={timeTickContentRenderer}
			options={{ referenceTime, offsetX }}
			bind:cursor
		/>

		{#each events.players as player (player.guid)}
			<div class="sticky left-2 my-1 flex w-max items-center gap-2 font-bold">
				<img
					style:--size="18"
					style="width:calc(var(--size)* 1px); height:calc(var(--size)* 1px);"
					src="https://assets.rpglogs.com/img/warcraft/icons/actors.jpg?v=27"
					class="sprite actor-sprite-{player.icon}"
					alt={player.icon}
				/>
				<span style:color={ClassUtils.classColor(player.icon.split('-')[0])}>{player.name}</span>
			</div>

			<DamageEventsViewer
				damageTakenEvents={damageEventsPartitioned.byTarget[player.id] ?? []}
				options={{ referenceTime, offsetX }}
				{buffDict}
				bind:cursor
			/>
			<div class="py-1">
				<CastEventsViewer
					castEventsBySource={castEventsPartitioned.bySource[player.id] ?? []}
					castEventsByTarget={castEventsPartitioned.byTarget[player.id] ?? []}
					buffEvents={buffEventsPartitioned.bySource[player.id] ?? []}
					debuffEvents={debuffEventsPartitioned.bySource[player.id] ?? []}
					{showMinor}
					{showReceived}
					{width}
					options={{ referenceTime, offsetX }}
					bind:cursor
				/>
			</div>
		{/each}
	</div>
</div>
