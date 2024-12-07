<script lang="ts">
	import type { DamageTakenEvent } from '$lib/api/wclTypes';
	import Timeline from '$lib/Timeline.svelte';
	import { ability2img } from '$lib/utils/link';

	type Props = {
		damageTakenEvents: DamageTakenEvent[];
		options: {
			mergeDotInterval?: number;
		};
		cursor: number | null;
	};
	let { damageTakenEvents, options = {}, cursor = $bindable(null) }: Props = $props();
	const defaultMergeDotInterval = 5000;
	const mergeDotInterval = options.mergeDotInterval ?? defaultMergeDotInterval;

	// Merge damage events with the same spell id if they are close enough.
	let mergeData = $derived.by(() => {
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

	const detailsCreator = (event: DamageTakenEvent) =>
		`${event.amount}` +
		(event.absorbed ? ` (A: ${event.absorbed})` : '') +
		(event.overkill ? ` (O: ${event.overkill})` : '');

	let icons = $derived(
		damageTakenEvents.map((event) => ({
			timestamp: event.timestamp,
			content: ability2img(event.ability),
			details: `${event.ability.name} (#${event.ability.guid})<br>` + detailsCreator(event)
		}))
	);
</script>

<Timeline datatype="spellIcon" data={{ icons, mergeGroups: mergeData }} bind:cursor />
