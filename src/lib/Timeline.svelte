<script lang="ts">
	import { onMount } from 'svelte';
	import { AppState, getAppState } from './settings';
	import WithTooltip from './WithTooltip.svelte';
	import { formatTime } from './utils';
	import type { GeneralEvent } from './api/wclTypes';

	type Icon = { timestamp: number; content: string; details?: string };
	type Props = {
		datatype: 'text' | 'spellIcon';
		data: {
			icons: Icon[];
			mergeData: { idx: number; merged: number[] }[] | null;
		};
		cursor: number | null;
	};
	let { datatype, data, cursor = $bindable() }: Props = $props();
	const appSettings = getAppState();

	let ms2px = $derived(appSettings?.settings?.ms2px || 10.0);
	const offsetX = (timestamp: number) => (timestamp / 1000.0) * ms2px;
	const maxOffsetX = 15;

	const offsetYLimit = 5;
	const offsetYdata = $derived.by(() => {
		const numIcons = data.icons.length;
		const res: number[] = Array(numIcons).fill(0);
		for (let i = 1; i < numIcons; i++) {
			if (
				offsetX(data.icons[i].timestamp - data.icons[i - 1].timestamp) < maxOffsetX &&
				res[i - 1] < offsetYLimit
			) {
				res[i] = res[i - 1] + 1;
			}
		}
		return res;
	});
	// offsetYdata should be eventually replaced by offsetYdata2
	const offsetYdata2 = $derived.by(() => {
		const numIcons = data.icons.length;
		const res: number[] = Array(numIcons).fill(-1);
		const occupied: number[] = [-1.0];
		for (let i = 0; i < numIcons; i++) {
			if (res[i] >= 0) continue;
			let j = 0;
			for (j = 0; j < occupied.length; j++) {
				if (data.icons[i].timestamp - occupied[j] > 1500) {
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
	const maxOffsetY = $derived(Math.max(...offsetYdata2));
	const offsetY2px = 20;

	function setCursor(timestamp: number) {
		cursor = offsetX(timestamp);
	}
</script>

<div class="relative h-8 py-1" style:height="{32 + maxOffsetY * offsetY2px}px">
	{#each data.icons as icon, i (i)}
		{@const timestamp = icon.timestamp}
		<div
			class="absolute inline-block p-[2px] hover:z-[1] hover:shadow-[inset_0_0_0_2px_rgb(255,255,255,0.6)]"
			style:left="{offsetX(timestamp)}px"
			style:top="{offsetYdata2[i] * offsetY2px}px"
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
