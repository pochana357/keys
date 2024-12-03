<script lang="ts">
	import type { EventsClass } from '$lib/api/event';
	import type { Ability, EventRaw } from '$lib/api/wclTypes';
	import { getAppState } from '$lib/settings';
	import Timeline from '$lib/Timeline.svelte';
	import { formatTime, ClassUtils } from '$lib/utils';

	let { events }: { events: EventsClass } = $props();
	let cursor: number | null = $state(0);
	const timeTick = 10000;
	const numTimeTicks = $derived(Math.ceil((events.endTime - events.startTime) / timeTick));

	const timeTickCreator = (i: number) => ({
		timestamp: i * timeTick,
		content: formatTime(i * 10000, 0, 0)
	});
	const timeTicks = $derived([...Array(numTimeTicks + 1).keys()].map(timeTickCreator));

	function addLink(content: string, url: string) {
		return `<a href="${url}" target="_blank">${content}</a>`;
	}
	function addSpellLink(content: string, spellId: number) {
		return addLink(content, `https://www.wowhead.com/spell=${spellId}`);
	}
	function ability2img(ability: Ability) {
		const img = `<img class="w-5 max-w-none" src="https://assets.rpglogs.com/img/warcraft/abilities/${ability.abilityIcon}" alt="${ability.name}" />`;
		return addSpellLink(img, ability.guid);
	}
	function event2icon<T extends EventRaw>(event: T, detailsCreator: (event: T) => string) {
		return {
			timestamp: event.timestamp,
			content: ability2img(event.ability),
			details: `${event.ability.name} (${event.ability.guid})<br>` + detailsCreator(event)
		};
	}

	const appSettings = getAppState();
	let ms2px = $derived(appSettings?.settings?.ms2px || 10.0);
	const offsetX = (timestamp: number) => (timestamp / 1000.0) * ms2px;

	function processCasts(playerId: number) {
		const mir = events.casts
			.filter((e) => e.source?.id === playerId)
			.map((e) => ({
				raw: e,
				icon: event2icon(
					e,
					(e2) => `${e2.source?.name}` + (e2.target ? ` ▶ ${e2.target.name}` : '')
				)
			}));
		return { icons: mir.map((m) => m.icon), mergeData: null };
	}
	function processDamages(
		playerId: number,
		options: { mergeDotInterval?: number } = { mergeDotInterval: 5000 }
	) {
		const mir = events.damages
			.filter((e) => e.target?.id === playerId)
			.map((e) => ({
				raw: e,
				icon: event2icon(e, (e2) => `${e2.amount}` + (e2.absorbed ? ` (A: ${e2.absorbed})` : ''))
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

				if (e.raw.ability.guid === 333634) {
					console.log(idx, e.raw.targetID, e.raw.timestamp, lastTimestamp);
				}
			} else {
				// new damage
				res.push({ idx, merged: [] });
				lastTimestamps.set(e.raw.ability.guid, {
					mirIdx: idx,
					resIdx: res.length - 1,
					timestamp: e.icon.timestamp
				});

				if (e.raw.ability.guid === 333634) {
					console.log(idx, e.raw.targetID, e.raw.timestamp, lastTimestamp, 'enw');
				}
			}
		});
		console.log(mir);
		console.log(res);

		return { icons: mir.map((m) => m.icon), mergeData: res };
	}
</script>

<div class="px-2">
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
		{#each events.players.values() as player (player.guid)}
			<div class="flex items-center gap-2">
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
			<Timeline datatype="spellIcon" data={processCasts(player.id)} bind:cursor />
		{/each}
	</div>
</div>
