<script lang="ts" module>
	export type Icon<T> = { timestamp: number; data: T; emphasisLevel?: number };
</script>

<script lang="ts" generics="T">
	import { onMount, type Snippet } from 'svelte';
	import { AppState, getAppState } from '$lib/AppState';
	import WithTooltip from './WithTooltip.svelte';
	import { formatTime } from '$lib/utils/utils';
	type Props = {
		datatype: 'text' | 'spellIcon';
		icons: Icon<T>[];
		contentRenderer: Snippet<[Icon<T>]>;
		detailsRenderer?: Snippet<[Icon<T>, number]>;
		options: {
			mergeGroups?: { firstEventIdx: number; mergedIdxs: number[] }[];
			referenceTime?: number;
			offsetX?: (timestamp: number) => number;
		};
		cursor: number | null;
	};
	let {
		datatype,
		icons,
		contentRenderer,
		detailsRenderer,
		options = {},
		cursor = $bindable()
	}: Props = $props();
	const appState = getAppState();

	let pxPerSec = $derived(appState?.settings?.pxPerSec || AppState.defaultSettings.pxPerSec);
	let horizontalOverlap = $derived(
		appState?.settings?.horizontalOverlap || AppState.defaultSettings.horizontalOverlap
	);
	let pxPerLevel = $derived(appState?.settings?.pxPerLevel || AppState.defaultSettings.pxPerLevel);
	let referenceTime = $derived(options.referenceTime ?? 0);
	const offsetX = options.offsetX ?? ((timestamp: number) => (timestamp / 1000.0) * pxPerSec);

	const maxLevel = 5;
	const getLevel1 = $derived.by(() => {
		const numIcons = icons.length;
		const res: number[] = Array(numIcons).fill(0);
		for (let i = 1; i < numIcons; i++) {
			if (
				offsetX(icons[i].timestamp - icons[i - 1].timestamp) <= horizontalOverlap &&
				res[i - 1] < maxLevel
			) {
				res[i] = res[i - 1] + 1;
			}
		}
		return res;
	});
	// getLevel1 should be eventually replaced by getLevel2
	const getLevel2 = $derived.by(() => {
		const numIcons = icons.length;
		const res: number[] = Array(numIcons).fill(-1);
		const occupied: number[] = [];
		for (let i = 0; i < numIcons; i++) {
			if (res[i] >= 0) continue;
			let j = 0;
			for (j = 0; j < occupied.length; j++) {
				if (((icons[i].timestamp - occupied[j]) / 1000.0) * pxPerSec > horizontalOverlap) {
					break;
				}
			}
			res[i] = j;
			if (j == occupied.length) {
				occupied.push(icons[i].timestamp);
			} else {
				occupied[j] = icons[i].timestamp;
			}

			if (options.mergeGroups) {
				const k = options.mergeGroups.findIndex(
					({ firstEventIdx: idx, mergedIdxs: merged }) => idx === i
				);
				if (k >= 0) {
					options.mergeGroups[k].mergedIdxs.forEach((idx) => {
						res[idx] = j;
						occupied[j] = Math.max(occupied[j], icons[idx].timestamp);
					});
				}
			}
		}
		return res;
	});
	const heightInLevel = $derived(Math.max(...getLevel2));

	function setCursor(timestamp: number) {
		cursor = offsetX(timestamp);
	}

	// const offsetYdata = $derived(datatype === 'text' ? offsetYdata1 : offsetYdata2);
	const offsetYdata = $derived(getLevel2);

	function getBoundaryClasses(emphasisLevel: number) {
		if (datatype === 'text') {
			return '';
		}
		if (emphasisLevel === 99) {
			return 'z-[1] shadow-[inset_0_0_0_6px_rgba(255,0,0,1)]';
		} else {
			return 'hover:z-[1] hover:shadow-[inset_0_0_0_2px_rgb(255,255,255,0.6)]';
		}
	}
</script>

<div class="relative" style:height="calc(1.5rem + {heightInLevel * pxPerLevel}px)">
	{#each icons as icon, i (i)}
		{@const timestamp = icon.timestamp}
		{@const boundaryClasses = getBoundaryClasses(icon.emphasisLevel ?? 0)}
		<!-- Overkill in the damage-taken timeline: red boundary -->
		<div
			class="absolute inline-block p-[2px] ${boundaryClasses}"
			style:left="{offsetX(timestamp)}px"
			style:top="{offsetYdata[i] * pxPerLevel}px"
			role="button"
			tabindex="0"
			onmouseover={() => setCursor(timestamp)}
			onfocus={() => setCursor(timestamp)}
			onmouseleave={() => (cursor = null)}
			onblur={() => (cursor = null)}
		>
			{#if detailsRenderer}
				<WithTooltip placement="bottom">
					{#snippet tooltip()}
						{@render detailsRenderer(icon, referenceTime)}
					{/snippet}
					{@render contentRenderer(icon)}
				</WithTooltip>
			{:else}
				{@render contentRenderer(icon)}
			{/if}
		</div>
	{/each}
</div>
