<script lang="ts">
  import { settingsRange, type Settings, AppState } from '$lib/AppState';
  import IconEye from 'lucide-svelte/icons/eye';
  import IconEyeOff from 'lucide-svelte/icons/eye-off';
  import SettingSlider from '$lib/SettingSlider.svelte';
  import SettingSwitch from '$lib/SettingSwitch.svelte';
  type Props = Settings & {
    invalidApiKey?: boolean;
  };
  let {
    pxPerSec = $bindable(),
    horizontalOverlap = $bindable(),
    pxPerLevel = $bindable(),
    showMinor = $bindable(),
    showReceived = $bindable(),
    pullStartAsReferenceTime = $bindable(),
    damageGroupInterval = $bindable(),
    wclApiKey = $bindable(),
    invalidApiKey = false,
  }: Props = $props();
  let showWclApiKey = $state(false);
  let shouldWarnApiKey = $derived(!wclApiKey.trim() || invalidApiKey);
</script>

<div class="flex gap-4 pb-1">
  <div>
    <div class="text-lg font-bold">Layout</div>
    <hr class="mt-1 mb-2" />
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
    <hr class="mt-1 mb-2" />
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

    <div class="mt-6">
      <div class="text-lg font-bold">API</div>
      <hr class="mt-1 mb-2" />
      <label class="block w-96">
        <span>Warcraft Logs API key</span>
        <div class="mt-2 flex">
          <input
            class="input min-w-0 flex-1 rounded-r-none font-mono"
            name="wclApiKey"
            type={showWclApiKey ? 'text' : 'password'}
            autocomplete="off"
            spellcheck="false"
            bind:value={wclApiKey}
          />
          <button
            type="button"
            class="btn h-10 w-14 flex-none"
            aria-label={showWclApiKey
              ? 'Hide Warcraft Logs API key'
              : 'Show Warcraft Logs API key'}
            title={showWclApiKey ? 'Hide API key' : 'Show API key'}
            onclick={() => (showWclApiKey = !showWclApiKey)}
          >
            {#if showWclApiKey}
              <IconEyeOff strokeWidth={2.25} />
            {:else}
              <IconEye strokeWidth={2.25} />
            {/if}
          </button>
        </div>
        <span
          class="mt-1 block text-sm"
          class:text-red-400={shouldWarnApiKey}
          class:font-bold={shouldWarnApiKey}
          class:text-surface-300={!shouldWarnApiKey}
        >
          You must provide your own Warcraft Logs API key before loading
          reports.
        </span>
      </label>
    </div>

    <button
      type="button"
      class="btn preset-filled-primary-700-300 mt-8 h-10 font-bold"
      onclick={() => {
        pxPerSec = AppState.defaultSettings.pxPerSec;
        horizontalOverlap = AppState.defaultSettings.horizontalOverlap;
        pxPerLevel = AppState.defaultSettings.pxPerLevel;
        showMinor = AppState.defaultSettings.showMinor;
        showReceived = AppState.defaultSettings.showReceived;
        pullStartAsReferenceTime =
          AppState.defaultSettings.pullStartAsReferenceTime;
        damageGroupInterval = AppState.defaultSettings.damageGroupInterval;
      }}
    >
      Reset settings
    </button>
  </div>
</div>
