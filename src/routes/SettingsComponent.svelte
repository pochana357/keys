<script lang="ts">
	import { settingsRange, type Settings, AppState } from '$lib/AppState';
	import { Slider, Switch } from '@skeletonlabs/skeleton-svelte';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	type Props = Settings & { defaultSettings: Settings };
	let {
		pxPerSec = $bindable(),
		horizontalOverlap = $bindable(),
		pxPerLevel = $bindable(),
		showMinor = $bindable(),
		showReceived = $bindable(),
		pullStartAsReferenceTime = $bindable(),
		damageGroupInterval = $bindable()
	}: Props = $props();
	let pxPerSecWrapped = $state([pxPerSec]);
	let horizontalOverlapWrapped = $state([horizontalOverlap]);
	let pxPerLevelWrapped = $state([pxPerLevel]);
	let damageGroupIntervalWrapped = $state([damageGroupInterval]);
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
	$effect(() => {
		if (damageGroupInterval !== damageGroupIntervalWrapped[0])
			damageGroupInterval = damageGroupIntervalWrapped[0];
	});
</script>

<div class="flex gap-4 pb-1">
	<div>
		<div class="text-lg font-bold">Layout</div>
		<hr class="mb-2 mt-1" />
		<div class="flex w-96 flex-col gap-2">
			<p>Time scale (px/s): {pxPerSec}</p>
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
			<p>Icon overlap threshold (px): {horizontalOverlap}</p>
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
			<p>Timeline spacing (px): {pxPerLevel}</p>
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
			<p>Damage Grouping Threshold (ms): {damageGroupInterval}</p>
			<Slider
				name="pxPerLevel"
				min={settingsRange.damageGroupInterval[0]}
				max={settingsRange.damageGroupInterval[1]}
				step={1}
				bind:value={damageGroupIntervalWrapped}
				height="h-2"
				meterBg="bg-primary-400"
				trackBg="bg-slate-400"
				classes="px-5"
			/>
			<div class="mt-1 flex justify-between">
				<p>Set reference time to start of the pull</p>
				<Switch
					name="showReceived"
					bind:checked={pullStartAsReferenceTime}
					controlInactive="bg-secondary-100"
				>
					{#snippet inactiveChild()}<IconX size="14" />{/snippet}
					{#snippet activeChild()}<IconCheck size="14" />{/snippet}
				</Switch>
			</div>
		</div>
	</div>
	<div>
		<div class="text-lg font-bold">Filters</div>
		<hr class="mb-2 mt-1" />
		<div class="flex w-96 flex-col gap-2">
			<div class="flex justify-between">
				<p>Show offensives and minor defensives</p>
				<Switch name="showMinor" bind:checked={showMinor} controlInactive="bg-secondary-100">
					{#snippet inactiveChild()}<IconX size="14" />{/snippet}
					{#snippet activeChild()}<IconCheck size="14" />{/snippet}
				</Switch>
			</div>
			<div class="flex justify-between">
				<p>Show spells received by friendlies</p>
				<Switch name="showReceived" bind:checked={showReceived} controlInactive="bg-secondary-100">
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
				damageGroupIntervalWrapped = [AppState.defaultSettings.damageGroupInterval];
				showMinor = AppState.defaultSettings.showMinor;
				showReceived = AppState.defaultSettings.showReceived;
				pullStartAsReferenceTime = AppState.defaultSettings.pullStartAsReferenceTime;
				damageGroupInterval = AppState.defaultSettings.damageGroupInterval;
			}}
		>
			Reset settings
		</button>
	</div>
</div>
