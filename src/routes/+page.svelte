<script lang="ts">
	import IconHourglass from 'lucide-svelte/icons/hourglass';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	import IconHistory from 'lucide-svelte/icons/history';
	import IconSettings from 'lucide-svelte/icons/settings';
	import IconAlignJustify from 'lucide-svelte/icons/align-justify';
	import type { FightPullRaw, FightsRaw, PullRaw } from '$lib/api/wclTypes';
	import { EventsClass } from '$lib/api/event.svelte';
	import Log from '$lib/api/log.svelte';
	import { onMount } from 'svelte';
	import OutlineView from './OutlineView.svelte';
	import EventViewer from './EventViewer.svelte';
	import { AppState, OApiStatus } from '$lib/AppState';
	import LoadingScreen from './LoadingScreen.svelte';
	import SettingsComponent from './SettingsComponent.svelte';
	import History from './History.svelte';

	let appState = new AppState();
	let logs: { [code: string]: Log } = $state({});
	let currentLog: Log | undefined = $derived(logs[appState.code]);
	let currentFightPullRaw: FightPullRaw | null = $state(null);
	let currentDungeonPullRaw: PullRaw | null = $state(null);
	let codeInputFormValue = $state('');
	let settings = $derived(appState.settings);
	let visibility = $derived(appState.visibility);
	const urlParams = new URLSearchParams(window.location.search);

	async function callApi(code: string, fightIdx = -1, dungeonPullIdx = -1) {
		if (!logs[code]) {
			appState.api.status = OApiStatus.busy;
			try {
				logs[code] = await Log.build(code);
				appState.api.status = OApiStatus.succeeded;
			} catch (err) {
				appState.api.status = OApiStatus.failed;
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
				.analyzePull(dungeonPull.dungeonPullRaw, { progressCallback })
				.then((e) => {
					appState.api.status = OApiStatus.succeeded;
					return { dungeonPull, eventsClass: e };
				})
				.catch((err) => {
					console.log(err);
					appState.api.status = OApiStatus.failed;
					throw err;
				});
		} else return null;
	}

	async function handleSubmit(fightIdx = -1, dungeonPullIdx = -1) {
		if (codeInputFormValue.length < 5) return;
		return callApi(codeInputFormValue, fightIdx, dungeonPullIdx)
			.then((res) => {
				appState.code = codeInputFormValue;
				appState.pushCodeToHistory(logs[codeInputFormValue]);
				if (res) {
					appState.fightIdx = fightIdx;
					appState.dungeonPullIdx = dungeonPullIdx;
					currentFightPullRaw = res.dungeonPull.fightPullRaw;
					currentDungeonPullRaw = res.dungeonPull.dungeonPullRaw;
					events = res.eventsClass;
				} else {
					appState.fightIdx = -1;
					appState.dungeonPullIdx = -1;
					currentFightPullRaw = null;
					currentDungeonPullRaw = null;
					events = new EventsClass();
				}
				return events;
			})
			.catch((err) => {
				// pass
			});
	}
	async function submitCode(newCode: string, fightIdx = -1, dungeonPullIdx = -1) {
		console.log('submitCode', newCode);
		if (codeInputFormValue !== newCode) codeInputFormValue = newCode;
		// if (appState.code !== codeInputFormValue) handleSubmit(-1, -1); else
		handleSubmit(fightIdx, dungeonPullIdx);
	}
	async function submitMostRecentCode() {
		const codes = appState.history.items;
		return submitCode(codes?.[codes.length - 1].code ?? '');
	}
	const toNumber = (s: string | null) => {
		if (!s) return -1;
		const n = parseInt(s);
		return isNaN(n) ? -1 : n;
	};
	onMount(async () => {
		appState.validateSettings();
		const fromUrl = {
			code: urlParams.get('code') ?? '',
			fightIdx: toNumber(urlParams.get('fight')),
			dungeonPullIdx: toNumber(urlParams.get('pull'))
		};

		console.log('urlParams', fromUrl);
		if (!fromUrl.code) submitMostRecentCode();
		await submitCode(fromUrl.code, fromUrl.fightIdx, fromUrl.dungeonPullIdx);
	});

	let progress = $state({ total: 0, current: 0 });
	const progressCallback = (current: number, start: number, end: number) => {
		progress = { total: end - start, current: current - start };
	};

	let events = $state(new EventsClass());
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
				placeholder="(e.g., 6awx1JdH28CG94gq)"
				bind:value={codeInputFormValue}
			/>
			<button
				type="button"
				class="btn h-10 w-20 flex-none font-bold preset-filled-primary-950-50"
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
					class="w-15 h-10 flex-none px-1 font-bold hover:text-primary-200"
					class:text-secondary-200={visibility.history}
					onclick={() => (visibility.history = !visibility.history)}
				>
					<IconHistory />
				</button>
				<button
					type="button"
					class="w-15 h-10 flex-none px-1 font-bold hover:text-primary-200"
					class:text-secondary-200={visibility.outline}
					onclick={() => (visibility.outline = !visibility.outline)}
				>
					<IconAlignJustify />
				</button>
				<button
					type="button"
					class="w-15 h-10 flex-none px-1 font-bold hover:text-primary-200"
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
			<div class="h-10 w-20 flex-none text-center font-bold leading-10">Settings</div>
			<div class="flex-1 overflow-x-clip border py-2 pl-3">
				<SettingsComponent
					bind:pxPerSec={settings.pxPerSec}
					bind:horizontalOverlap={settings.horizontalOverlap}
					bind:pxPerLevel={settings.pxPerLevel}
					bind:showMinors={settings.showMinors}
					bind:showReceived={settings.showReceived}
					defaultSettings={AppState.defaultSettings}
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
				{#if currentDungeonPullRaw}
					<EventViewer
						{events}
						options={{
							pxPerSec: settings.pxPerSec,
							showMinors: settings.showMinors,
							showReceived: settings.showReceived
						}}
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
		<div class="pt-8 text-center">
			<p class="text-2xl font-bold">Welcome to Log Analyzer for Mythic Plus.</p>
			<p class="text-lg">Enter a Warcraft Logs code to get started.</p>
		</div>
	{/if}
	{#if appState.api.status == OApiStatus.busy}
		<LoadingScreen current={progress.current} total={progress.total} />
	{/if}
</div>
