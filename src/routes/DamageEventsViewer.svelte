<script lang="ts">
	import type { DamageTakenEvent } from '$lib/api/wclTypes';
	import Timeline, { type Icon } from '$lib/Timeline.svelte';
	import { ability2img } from '$lib/utils/link';
	import { formatTime } from '$lib/utils/utils';

	type Props = {
		damageTakenEvents: DamageTakenEvent[];
		options: {
			mergeDotInterval?: number;
			referenceTime?: number;
			offsetX?: (timestamp: number) => number;
		};
		cursor: number | null;
	};
	let { damageTakenEvents, options = {}, cursor = $bindable(null) }: Props = $props();
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
			{event.amount}
			{#if event.absorbed}
				(A: {event.absorbed})
			{/if}
			{#if event.overkill}
				(O: {event.overkill})
			{/if}
		</p>
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
