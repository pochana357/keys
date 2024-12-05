<script lang="ts">
	import { getAppState, settingsRange, type Settings, AppState } from '$lib/AppState';
	import { Slider, Switch } from '@skeletonlabs/skeleton-svelte';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	type Props = Settings & { defaultSettings: Settings };
	let {
		pxPerSec = $bindable(),
		horizontalOverlap = $bindable(),
		pxPerLevel = $bindable(),
		showMinors = $bindable()
	}: Props = $props();
	let pxPerSecWrapped = $state([pxPerSec]);
	let horizontalOverlapWrapped = $state([horizontalOverlap]);
	let pxPerLevelWrapped = $state([pxPerLevel]);
	$effect(() => {
		if (pxPerSec !== pxPerSecWrapped[0]) pxPerSec = pxPerSecWrapped[0];
	});
	$effect(() => {
		if (horizontalOverlap !== horizontalOverlapWrapped[0])
			horizontalOverlap = horizontalOverlapWrapped[0];
	});
	$effect(() => {
		if (pxPerLevel !== pxPerLevelWrapped[0]) pxPerLevel = pxPerLevelWrapped[0];
	});
</script>

<div class="flex gap-4">
	<div>
		<div class="text-lg font-bold">Display</div>
		<hr class="mb-2 mt-1" />
		<div class="flex w-96 flex-col gap-2">
			<p>Horizontal size (px/s): {pxPerSec}</p>
			<Slider
				name="pxPerSec"
				min={settingsRange.pxPerSec[0]}
				max={settingsRange.pxPerSec[1]}
				step={1}
				bind:value={pxPerSecWrapped}
				height="h-2"
				meterBg="bg-primary-400"
				trackBg="bg-slate-400"
				classes="px-5"
			/>
			<p>Horizontal Overlap (px): {horizontalOverlap}</p>
			<Slider
				name="horizontalOverlap"
				min={settingsRange.horizontalOverlap[0]}
				max={settingsRange.horizontalOverlap[1]}
				step={1}
				bind:value={horizontalOverlapWrapped}
				height="h-2"
				meterBg="bg-primary-400"
				trackBg="bg-slate-400"
				classes="px-5"
			/>
			<p>Line height between timelines (px): {pxPerLevel}</p>
			<Slider
				name="pxPerLevel"
				min={settingsRange.pxPerLevel[0]}
				max={settingsRange.pxPerLevel[1]}
				step={1}
				bind:value={pxPerLevelWrapped}
				height="h-2"
				meterBg="bg-primary-400"
				trackBg="bg-slate-400"
				classes="px-5"
			/>
		</div>
	</div>
	<div>
		<div class="text-lg font-bold">Content</div>
		<hr class="mb-2 mt-1" />
		<div class="w-96">
			<div class="flex justify-between">
				<p>Show offensives and minor defensives</p>
				<Switch name="showMinors" bind:checked={showMinors} controlInactive="bg-secondary-100">
					{#snippet inactiveChild()}<IconX size="14" />{/snippet}
					{#snippet activeChild()}<IconCheck size="14" />{/snippet}
				</Switch>
			</div>
		</div>

		<button
			type="button"
			class="btn mt-8 h-10 font-bold preset-filled-primary-950-50"
			onclick={() => {
				pxPerSecWrapped = [AppState.defaultSettings.pxPerSec];
				horizontalOverlapWrapped = [AppState.defaultSettings.horizontalOverlap];
				pxPerLevelWrapped = [AppState.defaultSettings.pxPerLevel];
				showMinors = AppState.defaultSettings.showMinors;
			}}
		>
			Reset settings
		</button>
	</div>
</div>
