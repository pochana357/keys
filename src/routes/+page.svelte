<script lang="ts">
  import IconHourglass from 'lucide-svelte/icons/hourglass';
  import IconX from 'lucide-svelte/icons/x';
  import IconCheck from 'lucide-svelte/icons/check';
  import IconHistory from 'lucide-svelte/icons/history';
  import IconSettings from 'lucide-svelte/icons/settings';
  import IconAlignJustify from 'lucide-svelte/icons/align-justify';
  import type {
    Ability,
    FightPullRaw,
    FightsRaw,
    PullRaw,
  } from '$lib/api/wclTypes';
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
  import { SvelteMap } from 'svelte/reactivity';

  let appState = new AppState();
  let logs: { [code: string]: Log } = $state({});
  let currentLog: Log | undefined = $derived(logs[appState.code]);
  let currentFightPullRaw: FightPullRaw | null = $state(null);
  let currentDungeonPullRaw: PullRaw | null = $state(null);
  let codeInputFormValue = $state('');
  let settings = $derived(appState.settings);
  let visibility = $derived(appState.visibility);
  let buffDict: SvelteMap<number, Ability> = new SvelteMap();
  let submitRequestId = 0;

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
      .catch((err) => {
        // pass
      });
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

  let events = $state(new EventsLumped());
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
        <button
          type="button"
          class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
          class:text-secondary-200={visibility.history}
          onclick={() => (visibility.history = !visibility.history)}
        >
          <IconHistory />
        </button>
        <button
          type="button"
          class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
          class:text-secondary-200={visibility.outline}
          onclick={() => (visibility.outline = !visibility.outline)}
        >
          <IconAlignJustify />
        </button>
        <button
          type="button"
          class="hover:text-primary-200 h-10 flex-none px-1 font-bold"
          class:text-secondary-200={visibility.settings}
          onclick={() => (visibility.settings = !visibility.settings)}
        >
          <IconSettings />
        </button>
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
        <div class="w-84 flex-none overflow-y-auto">
          <OutlineView
            code={appState.code}
            fightsRaw={currentLog.fights.json}
            currentFightIdx={appState.fightIdx}
            currentDungeonPullIdx={appState.dungeonPullIdx}
            onUpdate={handleSubmit}
          />
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
              referenceTime: settings.pullStartAsReferenceTime
                ? currentDungeonPullRaw.start_time
                : currentFightPullRaw.start_time,
              damageGroupInterval: settings.damageGroupInterval,
            }}
            {buffDict}
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
