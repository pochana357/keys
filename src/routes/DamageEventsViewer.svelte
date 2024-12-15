<script lang="ts">
	import type { Ability, DamageTakenEvent } from '$lib/api/wclTypes';
	import Timeline, { type Icon } from '$lib/Timeline.svelte';
	import { ability2img } from '$lib/utils/link';
	import { formatTime } from '$lib/utils/utils';
	import type { SvelteMap } from 'svelte/reactivity';

	type Props = {
		damageTakenEvents: DamageTakenEvent[];
		options: {
			mergeDotInterval?: number;
			referenceTime?: number;
			offsetX?: (timestamp: number) => number;
		};
		buffDict: SvelteMap<number, Ability>;
		cursor: number | null;
	};
	let { damageTakenEvents, options = {}, buffDict, cursor = $bindable(null) }: Props = $props();
	const defaultMergeDotInterval = 5000;
	const mergeDotInterval = options.mergeDotInterval ?? defaultMergeDotInterval;

	let referenceTime = $derived(options.referenceTime ?? 0);

	// Merge damage events with the same spell id if they are close enough.
	let mergeGroups = $derived.by(() => {
		// lastTimestamps[spellId] stores the last timestamp of the damage event.
		const lastTimestamps = new Map<number, { mergeDataIdx: number; timestamp: number }>();
		// each entry of mergeData stores the index of the first damage event in the merge group (firstEventIdx)
		// and the indices of the merged damage events (mergedIdxs).
		const mergeGroups: { firstEventIdx: number; mergedIdxs: number[] }[] = [];

		damageTakenEvents.forEach((e, idx) => {
			const lastTimestamp = lastTimestamps.get(e.ability.guid);
			if (lastTimestamp && e.timestamp - lastTimestamp.timestamp < mergeDotInterval) {
				// The current and the previous damage events (with the same spell id) are mergeable.
				mergeGroups[lastTimestamp.mergeDataIdx].mergedIdxs.push(idx);
				lastTimestamp.timestamp = e.timestamp;
			} else {
				// The current damage begins a new merge group.
				mergeGroups.push({ firstEventIdx: idx, mergedIdxs: [] });
				lastTimestamps.set(e.ability.guid, {
					mergeDataIdx: mergeGroups.length - 1,
					timestamp: e.timestamp
				});
			}
		});

		return mergeGroups;
	});

	let icons = $derived(
		damageTakenEvents.map((event) => ({
			timestamp: event.timestamp,
			data: event,
			emphasisLevel: event.overkill && event.overkill > 0 ? 99 : 0
		}))
	);
</script>

{#snippet contentRenderer(icon: Icon<DamageTakenEvent>)}
	{@const event = icon.data}
	{@html ability2img(event.ability)}
{/snippet}
{#snippet detailsRenderer(icon: Icon<DamageTakenEvent>, referenceTime: number)}
	{@const event = icon.data}
	<div class="text-center">
		<p>
			{formatTime(icon.timestamp, referenceTime)}
			{event?.ability?.name} (#{event?.ability?.guid})
		</p>
		<p>
			Damage taken: {event.amount}
			{#if event.absorbed}
				(A: {event.absorbed})
			{/if}
			{#if event.overkill}
				(O: {event.overkill})
			{/if}
		</p>
		{#if event.buffs}
			<hr />
			<p class="font-bold">Defensive Buffs</p>
			{#each event.buffs.split('.') as buff (buff)}
				{#if buff.length > 0}
					{@const ability = buffDict.get(Number(buff))}
					{#if ability}
						<p>
							{@html ability2img(ability, 'inline-block')}
							{ability.name}
							(#{ability.guid})
						</p>
					{:else}
						<p>(#{buff})</p>
					{/if}
				{/if}
			{/each}
		{/if}
		{#if event.amount > 0}
			<hr />
			<p class="font-bold">Stats</p>
			{#if event.hitPoints && event.maxHitPoints}
				<p>
					HP remaining: {event.hitPoints} / {event.maxHitPoints} ({(
						(event.hitPoints / event.maxHitPoints) *
						100.0
					).toFixed(2)} %)
				</p>
			{/if}
			<p>Vers: {(event.versatility / 100.0).toFixed(2)}%</p>
			<p>Avoidance: {(event.avoidance / 100.0).toFixed(2)}%</p>
		{/if}
	</div>
{/snippet}
<Timeline
	datatype="spellIcon"
	{icons}
	{contentRenderer}
	{detailsRenderer}
	options={{ mergeGroups, referenceTime, offsetX: options.offsetX }}
	bind:cursor
/>
