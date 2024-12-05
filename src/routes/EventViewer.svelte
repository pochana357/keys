<script lang="ts">
	import defensiveSpells from '$lib/api/defensiveData';
	import type { EventsClass } from '$lib/api/event';
	import type { Ability, EventRaw, GeneralEvent } from '$lib/api/wclTypes';
	import { AppState } from '$lib/AppState';
	import Timeline from '$lib/Timeline.svelte';
	import { formatTime } from '$lib/utils/utils';
	import ClassUtils, { ORole } from '$lib/utils/ClassUtils';
	import { ability2img, addLink, addSpellLink } from '$lib/utils/link';
	import { blackList } from '$lib/api/spellData';

	type Props = {
		events: EventsClass;
		options: {
			pxPerSec?: number;
			showMinors?: boolean;
			showReceived?: boolean;
		};
	};
	let { events, options = {} }: Props = $props();
	let cursor: number | null = $state(0);
	const timeTick = 10000;
	const numTimeTicks = $derived(Math.ceil((events.endTime - events.startTime) / timeTick));

	const timeTickCreator = (i: number) => ({
		timestamp: i * timeTick,
		content: formatTime(i * 10000, 0, 0)
	});
	const timeTicks = $derived([...Array(numTimeTicks + 1).keys()].map(timeTickCreator));

	function event2icon<T extends EventRaw>(
		event: T,
		detailsCreator: (event: T) => string,
		classes = ''
	) {
		return {
			timestamp: event.timestamp,
			content: ability2img(event.ability, classes),
			details: `${event.ability.name} (${event.ability.guid})<br>` + detailsCreator(event)
		};
	}

	let showMinors = $derived(options.showMinors ?? AppState.defaultSettings.showMinors);
	let showReceived = $derived(options.showReceived ?? AppState.defaultSettings.showReceived);
	let pxPerSec = $derived(options.pxPerSec ?? AppState.defaultSettings.pxPerSec);
	const offsetX = (timestamp: number) => (timestamp / 1000.0) * pxPerSec;

	function filterEvents<T extends GeneralEvent>(
		events: T[],
		playerId: { source?: number; target?: number }
	) {
		const filtered = playerId.source
			? events.filter((e) => e.source?.id === playerId.source)
			: events;
		return playerId.target ? filtered.filter((e) => e.target?.id === playerId.target) : filtered;
	}
	function processCasts(playerId: number) {
		const mir = filterEvents(events.casts, { source: playerId }).map((e) => ({
			raw: e,
			icon: event2icon(e, (e2) => `${e2.source?.name}` + (e2.target ? ` ▶ ${e2.target.name}` : ''))
		}));
		const mirReceived = filterEvents(events.casts, { target: playerId })
			.map((e) => ({
				raw: e,
				icon: event2icon(
					e,
					(e2) => `${e2.source?.name}` + (e2.target ? ` ▶ ${e2.target.name}` : ''),
					'grayscale-[50%]'
				)
			}))
			.filter(
				(e) =>
					// e.raw.source?.id !== e.raw.target?.id &&
					!blackList.AoEHeals.includes(e.raw.ability.guid)
			)
			.filter((e) => showMinors || !defensiveSpells[e.raw.ability.guid].minor);
		const majorIcons = [];
		const minorIcons = [];

		for (const item of mir) {
			const spellId = item.raw.ability.guid;
			const defensiveSpell = defensiveSpells[spellId];
			if (!defensiveSpell) continue;
			if (defensiveSpell.minor) minorIcons.push(item.icon);
			else majorIcons.push(item.icon);
		}
		return { majorIcons, minorIcons, receivedIcons: mirReceived.map((m) => m.icon) };
	}
	function processDamages(
		playerId: number,
		options: { mergeDotInterval?: number } = { mergeDotInterval: 5000 }
	) {
		const mir = filterEvents(events.damages, { target: playerId }).map((e) => ({
			raw: e,
			icon: event2icon(
				e,
				(e2) =>
					`${e2.amount}` +
					(e2.absorbed ? ` (A: ${e2.absorbed})` : '') +
					(e2.overkill ? ` (O: ${e2.overkill})` : '')
			)
		}));

		if (!options.mergeDotInterval) return { icons: mir.map((m) => m.icon), mergeData: null };
		const mergeDotInterval = options.mergeDotInterval;

		const lastTimestamps = new Map<number, { mirIdx: number; resIdx: number; timestamp: number }>();
		const res: { idx: number; merged: number[] }[] = [];
		mir.forEach((e, idx) => {
			const lastTimestamp = lastTimestamps.get(e.raw.ability.guid);
			if (lastTimestamp && e.icon.timestamp - lastTimestamp.timestamp < mergeDotInterval) {
				// merge
				res[lastTimestamp.resIdx].merged.push(idx);
				lastTimestamp.timestamp = e.icon.timestamp;
			} else {
				// new damage
				res.push({ idx, merged: [] });
				lastTimestamps.set(e.raw.ability.guid, {
					mirIdx: idx,
					resIdx: res.length - 1,
					timestamp: e.icon.timestamp
				});
			}
		});
		return { icons: mir.map((m) => m.icon), mergeData: res };
	}

	let players = $derived.by(() => {
		const players = [...events.players.values()];
		players.sort((a, b) => {
			const roleDiff = String(ClassUtils.role(a)).localeCompare(String(ClassUtils.role(b)));
			return roleDiff !== 0 ? roleDiff : a.icon.localeCompare(b.icon);
		});
		return players;
	});
</script>

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
		<Timeline datatype="text" data={{ icons: timeTicks, mergeData: null }} bind:cursor />
		{#each players as player (player.guid)}
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
			<Timeline datatype="spellIcon" data={processDamages(player.id)} bind:cursor />

			{@const casts = processCasts(player.id)}
			<div class="py-1">
				<div class="w-full bg-slate-700" style:width="{offsetX(numTimeTicks * timeTick)}px">
					<Timeline datatype="spellIcon" data={{ icons: casts.majorIcons }} bind:cursor />
				</div>

				{#if showMinors && casts.minorIcons.length > 0}
					<div class="w-full bg-slate-600" style:width="{offsetX(numTimeTicks * timeTick)}px">
						<Timeline datatype="spellIcon" data={{ icons: casts.minorIcons }} bind:cursor />
					</div>
				{/if}

				{#if showReceived && casts.receivedIcons.length > 0}
					<div class="w-full bg-slate-500" style:width="{offsetX(numTimeTicks * timeTick)}px">
						<Timeline datatype="spellIcon" data={{ icons: casts.receivedIcons }} bind:cursor />
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
