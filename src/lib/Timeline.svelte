<script lang="ts">
	import { onMount } from 'svelte';
	import { AppState, getAppState, defaultSettings } from '$lib/AppState';
	import WithTooltip from './WithTooltip.svelte';
	import { formatTime } from '$lib/utils/utils';

	type Icon = { timestamp: number; content: string; details?: string };
	type Props = {
		datatype: 'text' | 'spellIcon';
		data: {
			icons: Icon[];
			mergeData?: { idx: number; merged: number[] }[] | null;
		};
		cursor: number | null;
	};
	let { datatype, data, cursor = $bindable() }: Props = $props();
	const appSettings = getAppState();

	let pxPerSec = $derived(appSettings?.settings?.pxPerSec || defaultSettings.pxPerSec);
	let horizontalOverlap = $derived(
		appSettings?.settings?.horizontalOverlap || defaultSettings.horizontalOverlap
	);
	let pxPerLevel = $derived(appSettings?.settings?.pxPerLevel || defaultSettings.pxPerLevel);

	const offsetX = (timestamp: number) => (timestamp / 1000.0) * pxPerSec;

	const maxLevel = 5;
	const getLevel1 = $derived.by(() => {
		const numIcons = data.icons.length;
		const res: number[] = Array(numIcons).fill(0);
		for (let i = 1; i < numIcons; i++) {
			if (
				offsetX(data.icons[i].timestamp - data.icons[i - 1].timestamp) <= horizontalOverlap &&
				res[i - 1] < maxLevel
			) {
				res[i] = res[i - 1] + 1;
			}
		}
		return res;
	});
	// getLevel1 should be eventually replaced by getLevel2
	const getLevel2 = $derived.by(() => {
		const numIcons = data.icons.length;
		const res: number[] = Array(numIcons).fill(-1);
		const occupied: number[] = [];
		for (let i = 0; i < numIcons; i++) {
			if (res[i] >= 0) continue;
			let j = 0;
			for (j = 0; j < occupied.length; j++) {
				if (offsetX(data.icons[i].timestamp - occupied[j]) > horizontalOverlap) {
					break;
				}
			}
			res[i] = j;
			if (j == occupied.length) {
				occupied.push(data.icons[i].timestamp);
			} else {
				occupied[j] = data.icons[i].timestamp;
			}

			if (data.mergeData) {
				const k = data.mergeData.findIndex(({ idx, merged }) => idx === i);
				if (k >= 0) {
					data.mergeData[k].merged.forEach((idx) => {
						res[idx] = j;
						occupied[j] = Math.max(occupied[j], data.icons[idx].timestamp);
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
</script>

<div class="relative my-1" style:height="calc(1.5rem + {heightInLevel * pxPerLevel}px)">
	{#each data.icons as icon, i (i)}
		{@const timestamp = icon.timestamp}
		<!-- Overkill in the damage taken timeline: red boundary -->
		<div
			class="absolute inline-block p-[2px] {icon.details?.includes('(O:')
				? 'z-[1] shadow-[inset_0_0_0_6px_rgba(255,0,0,1)]'
				: 'hover:z-[1] hover:shadow-[inset_0_0_0_2px_rgb(255,255,255,0.6)]'}"
			style:left="{offsetX(timestamp)}px"
			style:top="{offsetYdata[i] * pxPerLevel}px"
			role="button"
			tabindex="0"
			onmouseover={() => setCursor(timestamp)}
			onfocus={() => setCursor(timestamp)}
			onmouseleave={() => (cursor = null)}
			onblur={() => (cursor = null)}
		>
			{#if icon.details}
				<WithTooltip tooltip={`${formatTime(timestamp)} ${icon.details}`} placement="bottom">
					{@html icon.content}
				</WithTooltip>
			{:else}
				{@html icon.content}
			{/if}
		</div>
	{/each}
</div>
