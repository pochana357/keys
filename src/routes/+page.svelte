<script lang="ts">
  import IconHourglass from 'lucide-svelte/icons/hourglass';
  import IconX from 'lucide-svelte/icons/x';
  import IconCheck from 'lucide-svelte/icons/check';
  import IconHistory from 'lucide-svelte/icons/history';
  import IconSettings from 'lucide-svelte/icons/settings';
  import IconAlignJustify from 'lucide-svelte/icons/align-justify';
  import IconFileText from 'lucide-svelte/icons/file-text';
  import type { Ability, FightPullRaw, PullRaw } from '$lib/api/wclTypes';
  import EventsLumped from '$lib/api/EventsLumped.svelte';
  import Log from '$lib/api/Log.svelte';
  import { onMount } from 'svelte';
  import OutlineView from './OutlineView.svelte';
  import EventViewer from './EventViewer.svelte';
  import {
    AppState,
    currentPageFromSearch,
    OApiStatus,
    type UrlUpdateMode,
  } from '$lib/AppState';
  import LoadingScreen from './LoadingScreen.svelte';
  import SettingsComponent from './SettingsComponent.svelte';
  import History from './History.svelte';
  import ExportPane from './ExportPane.svelte';
  import WithTooltip from '$lib/WithTooltip.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type {
    ExportDamageSelection,
    ExportDefensiveSelection,
  } from '$lib/export/mrtNote';
  import {
    buildDamageSelections,
    buildDefaultMajorDefensiveSpellIds,
    buildSelectionMap,
    buildVisibleDefensiveSelectionGroupsForPull,
    selectBySpellIds,
    setSpellIdSelected,
    toggleSpellId,
  } from '$lib/export/exportSelection';
  import {
    defaultExportLanguage,
    type ExportLanguage,
  } from '$lib/export/spellAbbreviations';

  let appState = new AppState();
  let logs: { [code: string]: Log } = $state({});
  let events = $state(new EventsLumped());
  let currentLog: Log | undefined = $derived(logs[appState.code]);
  let currentFightPullRaw: FightPullRaw | null = $state(null);
  let currentDungeonPullRaw: PullRaw | null = $state(null);
  let codeInputFormValue = $state('');
  let settings = $derived(appState.settings);
  let visibility = $derived(appState.visibility);
  let exportSelections = $derived(appState.exportSelections);
  let buffDict: SvelteMap<number, Ability> = new SvelteMap();
  let exportLanguage: ExportLanguage = $state(defaultExportLanguage);
  let outlinePaneWidth = $state(336);
  let outlinePaneResizeStartX = 0;
  let outlinePaneResizeStartWidth = 0;
  let outlinePaneResizing = false;
  let exportPaneWidth = $state(384);
  let exportPaneResizeStartX = 0;
  let exportPaneResizeStartWidth = 0;
  let exportPaneResizing = false;
  let submitRequestId = 0;

  let allDamageSelections = $derived(buildDamageSelections(events.damages));
  let visibleDefensiveSelectionGroups = $derived(
    buildVisibleDefensiveSelectionGroupsForPull({
      castEvents: events.casts,
      buffEvents: events.buffs,
      debuffEvents: events.debuffs,
      showMinor: settings.showMinor,
      showReceived: settings.showReceived,
    }),
  );
  let visibleDefensiveSelections = $derived(
    visibleDefensiveSelectionGroups.all,
  );
  let selectedDamageList = $derived(
    selectBySpellIds(allDamageSelections, exportSelections.damageSpellIds),
  );
  let selectedDefensiveList = $derived(
    selectBySpellIds(
      visibleDefensiveSelections,
      exportSelections.defensiveSpellIds,
    ),
  );
  let selectedDamages = $derived(
    new SvelteMap<string, ExportDamageSelection>(
      buildSelectionMap(selectedDamageList),
    ),
  );
  let selectedDefensives = $derived(
    new SvelteMap<string, ExportDefensiveSelection>(
      buildSelectionMap(selectedDefensiveList),
    ),
  );

  let timelineReferenceTime = $derived.by(() => {
    if (!currentFightPullRaw || !currentDungeonPullRaw) return 0;
    return settings.pullStartAsReferenceTime
      ? currentDungeonPullRaw.start_time
      : currentFightPullRaw.start_time;
  });
  let exportReferenceTime = $derived.by(() =>
    currentDungeonPullRaw ? currentDungeonPullRaw.start_time : 0,
  );
  let eventViewerReferenceTime = $derived(
    visibility.export ? exportReferenceTime : timelineReferenceTime,
  );

  function isInvalidApiKeyError(err: unknown) {
    if (!(err instanceof Error)) return false;
    try {
      const parsed = JSON.parse(err.message) as {
        status?: number;
        error?: string;
      };
      return parsed.status === 401 && parsed.error === 'Invalid key specified.';
    } catch {
      return false;
    }
  }

  async function callApi(
    code: string,
    apiKey: string,
    fightIdx = -1,
    dungeonPullIdx = -1,
  ) {
    appState.api.invalidApiKey = false;
    if (!logs[code]) {
      appState.api.status = OApiStatus.busy;
      try {
        logs[code] = await Log.build(code, apiKey);
        appState.api.status = OApiStatus.succeeded;
      } catch (err) {
        appState.api.status = OApiStatus.failed;
        appState.api.invalidApiKey = isInvalidApiKeyError(err);
        console.log(err);
        return null;
      }
    } else {
      appState.api.status = OApiStatus.succeeded;
    }
    const dungeonPull = logs[code].getDungeonPull(fightIdx, dungeonPullIdx);
    if (dungeonPull) {
      appState.api.status = OApiStatus.busy;
      return logs[code]
        .fetchPull(dungeonPull.dungeonPullRaw, { apiKey, progressCallback })
        .then((e) => {
          appState.api.status = OApiStatus.succeeded;
          for (const buff of e.buffs) {
            if (!buffDict.has(buff.ability.guid))
              buffDict.set(buff.ability.guid, buff.ability);
          }
          return { dungeonPull, eventsClass: e };
        })
        .catch((err) => {
          console.log(err);
          appState.api.status = OApiStatus.failed;
          appState.api.invalidApiKey = isInvalidApiKeyError(err);
          throw err;
        });
    } else return null;
  }

  async function handleSubmit(
    fightIdx = -1,
    dungeonPullIdx = -1,
    urlUpdateMode: UrlUpdateMode = 'push',
  ) {
    const submittedCode = codeInputFormValue;
    const apiKey = settings.wclApiKey;
    const requestId = ++submitRequestId;
    if (submittedCode.length < 5) return;
    return callApi(submittedCode, apiKey, fightIdx, dungeonPullIdx)
      .then((res) => {
        if (requestId !== submitRequestId) return events;
        appState.pushCodeToHistory(logs[submittedCode]);
        if (res) {
          appState.setCurrentPage(
            { code: submittedCode, fightIdx, dungeonPullIdx },
            urlUpdateMode,
          );
          currentFightPullRaw = res.dungeonPull.fightPullRaw;
          currentDungeonPullRaw = res.dungeonPull.dungeonPullRaw;
          events = res.eventsClass;
        } else {
          appState.setCurrentPage(
            { code: submittedCode, fightIdx: -1, dungeonPullIdx: -1 },
            urlUpdateMode,
          );
          currentFightPullRaw = null;
          currentDungeonPullRaw = null;
          events = new EventsLumped();
        }
        return events;
      })
      .catch((_err) => {
        // pass
      });
  }

  function toggleDamageSelection(selection: ExportDamageSelection) {
    exportSelections.damageSpellIds = toggleSpellId(
      exportSelections.damageSpellIds,
      selection.ability.guid,
    );
  }

  function setDamageSpellIdSelected(spellId: number, selected: boolean) {
    exportSelections.damageSpellIds = setSpellIdSelected(
      exportSelections.damageSpellIds,
      spellId,
      selected,
    );
  }

  function toggleDefensiveSelection(selection: ExportDefensiveSelection) {
    exportSelections.defensiveSpellIds = toggleSpellId(
      exportSelections.defensiveSpellIds,
      selection.ability.guid,
    );
    exportSelections.defensiveDefaultsInitialized = true;
  }

  function setDefensiveSpellIdSelected(spellId: number, selected: boolean) {
    exportSelections.defensiveSpellIds = setSpellIdSelected(
      exportSelections.defensiveSpellIds,
      spellId,
      selected,
    );
    exportSelections.defensiveDefaultsInitialized = true;
  }

  function resetDefensiveSelectionsToDefaults() {
    exportSelections.defensiveSpellIds = buildDefaultMajorDefensiveSpellIds(
      visibleDefensiveSelectionGroups.major,
    );
    exportSelections.defensiveDefaultsInitialized = true;
  }

  $effect(() => {
    if (!visibility.export || !currentFightPullRaw || !currentDungeonPullRaw)
      return;
    if (exportSelections.defensiveDefaultsInitialized) return;
    resetDefensiveSelectionsToDefaults();
  });

  function resizeOutlinePane(nextWidth: number) {
    outlinePaneWidth = Math.min(640, Math.max(240, nextWidth));
  }

  function startOutlinePaneResize(event: PointerEvent) {
    event.preventDefault();
    outlinePaneResizing = true;
    outlinePaneResizeStartX = event.clientX;
    outlinePaneResizeStartWidth = outlinePaneWidth;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function moveOutlinePaneResize(event: PointerEvent) {
    if (!outlinePaneResizing) return;
    resizeOutlinePane(
      outlinePaneResizeStartWidth + event.clientX - outlinePaneResizeStartX,
    );
  }

  function stopOutlinePaneResize(event: PointerEvent) {
    if (!outlinePaneResizing) return;
    outlinePaneResizing = false;
    const resizeHandle = event.currentTarget as HTMLElement;
    if (resizeHandle.hasPointerCapture(event.pointerId)) {
      resizeHandle.releasePointerCapture(event.pointerId);
    }
  }

  function resizeOutlinePaneWithKeyboard(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    resizeOutlinePane(
      outlinePaneWidth + (event.key === 'ArrowRight' ? 24 : -24),
    );
  }

  function resizeExportPane(nextWidth: number) {
    exportPaneWidth = Math.min(720, Math.max(320, nextWidth));
  }

  function startExportPaneResize(event: PointerEvent) {
    event.preventDefault();
    exportPaneResizing = true;
    exportPaneResizeStartX = event.clientX;
    exportPaneResizeStartWidth = exportPaneWidth;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function moveExportPaneResize(event: PointerEvent) {
    if (!exportPaneResizing) return;
    resizeExportPane(
      exportPaneResizeStartWidth + exportPaneResizeStartX - event.clientX,
    );
  }

  function stopExportPaneResize(event: PointerEvent) {
    if (!exportPaneResizing) return;
    exportPaneResizing = false;
    const resizeHandle = event.currentTarget as HTMLElement;
    if (resizeHandle.hasPointerCapture(event.pointerId)) {
      resizeHandle.releasePointerCapture(event.pointerId);
    }
  }

  function resizeExportPaneWithKeyboard(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    resizeExportPane(exportPaneWidth + (event.key === 'ArrowLeft' ? 24 : -24));
  }

  async function submitCode(
    newCode: string,
    fightIdx = -1,
    dungeonPullIdx = -1,
    urlUpdateMode: UrlUpdateMode = 'push',
  ) {
    console.log('submitCode', newCode);
    if (codeInputFormValue !== newCode) codeInputFormValue = newCode;
    // if (appState.code !== codeInputFormValue) handleSubmit(-1, -1); else
    return handleSubmit(fightIdx, dungeonPullIdx, urlUpdateMode);
  }
  async function submitMostRecentCode(
    urlUpdateMode: UrlUpdateMode = 'replace',
  ) {
    const codes = appState.history.items;
    if (!codes || codes.length == 0) return;
    else {
      return submitCode(codes[codes.length - 1].code, -1, -1, urlUpdateMode);
    }
  }
  async function restoreFromLocation(urlUpdateMode: UrlUpdateMode) {
    const fromUrl = currentPageFromSearch(window.location.search);
    console.log('urlParams', fromUrl);
    if (fromUrl.code) {
      await submitCode(
        fromUrl.code,
        fromUrl.fightIdx,
        fromUrl.dungeonPullIdx,
        urlUpdateMode,
      );
    } else {
      await submitMostRecentCode(urlUpdateMode);
    }
  }
  onMount(() => {
    appState.validateSettings();
    void restoreFromLocation('replace');

    const handlePopState = () => {
      void restoreFromLocation('none');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });

  let progress = $state({ total: 0, current: 0 });
  const progressCallback = (current: number, start: number, end: number) => {
    progress = { total: end - start, current: current - start };
  };
</script>

<div class="flex h-screen w-screen flex-col gap-1">
  <form
    class="flex h-max flex-none flex-col gap-1"
    onsubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }}
  >
    <div class="align-center flex h-10 gap-1 text-center leading-10">
      <div class="w-20 flex-none font-bold">Code</div>
      <input
        class="input flex-1"
        class:bg-red-500={appState.api.status == OApiStatus.failed}
        name="description"
        type="text"
        placeholder="(e.g., 1DvhRcyAX9WwNQka)"
        bind:value={codeInputFormValue}
      />
      <button
        type="button"
        class="btn preset-filled-primary-700-300 h-10 w-20 flex-none font-bold"
        onclick={() => handleSubmit()}
        disabled={appState.isBusy()}
      >
        {#if appState.isBusy()}
          <IconHourglass />
        {:else if appState.api.status == OApiStatus.failed}
          <IconX />
        {:else if appState.api.status == OApiStatus.succeeded}
          <IconCheck />
        {:else}
          Go
        {/if}
      </button>
      <div class="px-2">
        <WithTooltip tooltip="History" placement="bottom">
          <button
            type="button"
            class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
            class:text-secondary-200={visibility.history}
            aria-label="Toggle history panel"
            onclick={() => (visibility.history = !visibility.history)}
          >
            <IconHistory />
          </button>
        </WithTooltip>
        <WithTooltip tooltip="Outline" placement="bottom">
          <button
            type="button"
            class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
            class:text-secondary-200={visibility.outline}
            aria-label="Toggle outline panel"
            onclick={() => (visibility.outline = !visibility.outline)}
          >
            <IconAlignJustify />
          </button>
        </WithTooltip>
        <WithTooltip tooltip="Export" placement="bottom">
          <button
            type="button"
            class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
            class:text-secondary-200={visibility.export}
            aria-label="Toggle export panel"
            onclick={() => (visibility.export = !visibility.export)}
          >
            <IconFileText />
          </button>
        </WithTooltip>
        <WithTooltip tooltip="Settings" placement="bottom">
          <button
            type="button"
            class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
            class:text-secondary-200={visibility.settings}
            aria-label="Toggle settings panel"
            onclick={() => (visibility.settings = !visibility.settings)}
          >
            <IconSettings />
          </button>
        </WithTooltip>
      </div>
    </div>
    {#if visibility.history}
      <History currentCode={appState.code} {submitCode} />
    {/if}
  </form>
  {#if visibility.settings}
    <div class="align-center flex h-max gap-1 pr-2">
      <div class="h-10 w-20 flex-none text-center leading-10 font-bold">
        Settings
      </div>
      <div class="flex-1 overflow-x-clip rounded-sm border py-2 pl-3">
        <SettingsComponent
          bind:pxPerSec={settings.pxPerSec}
          bind:horizontalOverlap={settings.horizontalOverlap}
          bind:pxPerLevel={settings.pxPerLevel}
          bind:showMinor={settings.showMinor}
          bind:showReceived={settings.showReceived}
          bind:pullStartAsReferenceTime={settings.pullStartAsReferenceTime}
          bind:damageGroupInterval={settings.damageGroupInterval}
          bind:wclApiKey={settings.wclApiKey}
          invalidApiKey={appState.api.invalidApiKey}
        />
      </div>
    </div>
  {/if}
  {#if currentLog?.fights?.json}
    <div class="flex flex-1 overflow-hidden">
      {#if visibility.outline}
        <div
          class="relative min-h-0 flex-none overflow-hidden"
          style:width={`${outlinePaneWidth}px`}
        >
          <div class="h-full overflow-y-auto">
            <OutlineView
              code={appState.code}
              fightsRaw={currentLog.fights.json}
              currentFightIdx={appState.fightIdx}
              currentDungeonPullIdx={appState.dungeonPullIdx}
              onUpdate={handleSubmit}
            />
          </div>
          <WithTooltip
            tooltip="Resize outline pane"
            placement="right"
            classes="absolute top-0 right-0 z-10 h-full w-2"
          >
            <button
              type="button"
              aria-label="Resize outline pane"
              class="hover:bg-primary-500/40 focus:bg-primary-500/40 h-full w-full cursor-col-resize outline-none"
              onpointerdown={startOutlinePaneResize}
              onpointermove={moveOutlinePaneResize}
              onpointerup={stopOutlinePaneResize}
              onpointercancel={stopOutlinePaneResize}
              onkeydown={resizeOutlinePaneWithKeyboard}
            ></button>
          </WithTooltip>
        </div>
      {/if}
      <div class="relative flex-1 overflow-x-auto">
        {#if currentFightPullRaw && currentDungeonPullRaw}
          <EventViewer
            {events}
            options={{
              pxPerSec: settings.pxPerSec,
              showMinor: settings.showMinor,
              showReceived: settings.showReceived,
              referenceTime: eventViewerReferenceTime,
              damageGroupInterval: settings.damageGroupInterval,
            }}
            {buffDict}
            exportMode={visibility.export}
            {selectedDamages}
            {selectedDefensives}
            {exportLanguage}
            onToggleDamageSelection={toggleDamageSelection}
            onToggleDefensiveSelection={toggleDefensiveSelection}
          />
        {:else}
          <p class="p-2 text-center text-lg">
            Select a pull on
            {#if visibility.outline}
              the left panel to view timelines.
            {:else}
              the Outline panel to view timelines.
            {/if}
          </p>
        {/if}
      </div>
      {#if visibility.export && currentFightPullRaw && currentDungeonPullRaw}
        <div
          class="relative min-h-0 flex-none overflow-hidden border-l"
          style:width={`${exportPaneWidth}px`}
        >
          <WithTooltip
            tooltip="Resize export pane"
            placement="left"
            classes="absolute top-0 left-0 z-10 h-full w-2"
          >
            <button
              type="button"
              aria-label="Resize export pane"
              class="hover:bg-primary-500/40 focus:bg-primary-500/40 h-full w-full cursor-col-resize outline-none"
              onpointerdown={startExportPaneResize}
              onpointermove={moveExportPaneResize}
              onpointerup={stopExportPaneResize}
              onpointercancel={stopExportPaneResize}
              onkeydown={resizeExportPaneWithKeyboard}
            ></button>
          </WithTooltip>
          <ExportPane
            damageSelections={selectedDamageList}
            defensiveSelections={selectedDefensiveList}
            damageCandidates={allDamageSelections}
            defensiveCandidates={visibleDefensiveSelections}
            referenceTime={exportReferenceTime}
            damageGroupIntervalMs={settings.damageGroupInterval}
            encounterId={currentDungeonPullRaw.boss}
            bind:exportLanguage
            onSetDamageSpellIdSelected={setDamageSpellIdSelected}
            onSetDefensiveSpellIdSelected={setDefensiveSpellIdSelected}
            onResetDefensiveSelections={resetDefensiveSelectionsToDefaults}
          />
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 pt-10 text-center"
    >
      <p class="text-2xl font-bold">Welcome to Log Analyzer for Mythic Plus.</p>
      {#if settings.wclApiKey.trim()}
        <p class="my-2 text-lg">Enter a Warcraft Logs code to get started.</p>
        <p>
          <span class="text-surface-300"
            >e.g., https://www.warcraftlogs.com/reports/<span
              class="text-primary-300 font-bold">1DvhRcyAX9WwNQka</span
            >#fight=23&type=damage-done</span
          >
        </p>
      {:else}
        <p class="my-2 text-lg">
          You must provide your own Warcraft Logs API key in Settings before
          loading a report.
        </p>
        <p class="text-surface-300">
          Get it from
          <a
            class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
            href="https://www.warcraftlogs.com/profile"
            target="_blank"
            rel="noreferrer"
          >
            Warcraft Logs
          </a>.
        </p>
      {/if}
    </div>
  {/if}
  {#if appState.api.status == OApiStatus.busy}
    <LoadingScreen current={progress.current} total={progress.total} />
  {/if}
</div>
