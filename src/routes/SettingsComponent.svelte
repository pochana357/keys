<script lang="ts">
	import { settingsRange, type Settings, AppState } from '$lib/AppState';
	import SettingSlider from '$lib/SettingSlider.svelte';
	import SettingSwitch from '$lib/SettingSwitch.svelte';
	type Props = Settings;
	let {
		pxPerSec = $bindable(),
		horizontalOverlap = $bindable(),
		pxPerLevel = $bindable(),
		showMinor = $bindable(),
		showReceived = $bindable(),
		pullStartAsReferenceTime = $bindable(),
		damageGroupInterval = $bindable()
	}: Props = $props();
</script>

<div class="flex gap-4 pb-1">
	<div>
		<div class="text-lg font-bold">Layout</div>
		<hr class="mb-2 mt-1" />
		<div class="flex w-96 flex-col gap-2">
			<SettingSlider
				description="Time scale (px/s)"
				name="pxPerSec"
				bind:value={pxPerSec}
				range={settingsRange.pxPerSec}
			/>
			<SettingSlider
				description="Icon overlap threshold (px)"
				name="horizontalOverlap"
				bind:value={horizontalOverlap}
				range={settingsRange.horizontalOverlap}
			/>
			<SettingSlider
				description="Timeline spacing (px)"
				name="pxPerLevel"
				bind:value={pxPerLevel}
				range={settingsRange.pxPerLevel}
			/>
			<SettingSlider
				description="Damage Grouping Threshold (ms)"
				name="damageGroupInterval"
				bind:value={damageGroupInterval}
				range={settingsRange.damageGroupInterval}
			/>
			<SettingSwitch
				description="Set reference time to start of the pull"
				name="pullStartAsReferenceTime"
				bind:flag={pullStartAsReferenceTime}
				classes="mt-1"
			/>
		</div>
	</div>
	<div>
		<div class="text-lg font-bold">Filters</div>
		<hr class="mb-2 mt-1" />
		<div class="flex w-96 flex-col gap-2">
			<SettingSwitch
				description="Show offensives and minor defensives"
				name="showMinor"
				bind:flag={showMinor}
			/>
			<SettingSwitch
				description="Show spells received by friendlies"
				name="showReceived"
				bind:flag={showReceived}
			/>
		</div>

		<button
			type="button"
			class="btn mt-8 h-10 font-bold preset-filled-primary-950-50"
			onclick={() => {
				pxPerSec = AppState.defaultSettings.pxPerSec;
				horizontalOverlap = AppState.defaultSettings.horizontalOverlap;
				pxPerLevel = AppState.defaultSettings.pxPerLevel;
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
