<script lang="ts">
	import IconHourglass from 'lucide-svelte/icons/hourglass';
	// import IconX from 'lucide-svelte/icons/circle-x';
	// import IconCheck from 'lucide-svelte/icons/circle-check';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	import IconHistory from 'lucide-svelte/icons/history';
	import IconSettings from 'lucide-svelte/icons/settings';
	import IconAlignJustify from 'lucide-svelte/icons/align-justify';
	import type { FightPullRaw, PullRaw } from '$lib/api/wclTypes';
	import { EventsClass } from '$lib/api/event';
	import Log from '$lib/api/log';
	import { onMount } from 'svelte';
	import OutlineView from './OutlineView.svelte';
	import EventViewer from './EventViewer.svelte';
	import { AppState, OApiStatus } from '$lib/AppState';
	import { formatAbsoluteTime } from '$lib/utils/utils';
	import LoadingScreen from './LoadingScreen.svelte';
	import SettingsComponent from './SettingsComponent.svelte';
	import History from './History.svelte';
	import WithTooltip from '$lib/WithTooltip.svelte';
	import { apiAddr } from '$lib/api/apiAddr';
	import Fights from '$lib/api/fights';

	let appState = new AppState();
	let log: Log | null = $state(null);
	let currentFightPullRaw: FightPullRaw | null = $state(null);
	let currentDungeonPullRaw: PullRaw | null = $state(null);
	let codeInputFormValue = $state('');
	let settings = $derived(appState.settings);
	let visibility = $derived(appState.visibility);
	const urlParams = new URLSearchParams(window.location.search);

	function selectDungeonPull(fightIdx: number, dungeonPullIdx: number) {
		const fightPullRaws = log?.fights?.json?.fights;
		if (fightPullRaws && fightIdx >= 0 && dungeonPullIdx >= 0) {
			const fightPullRaw = fightPullRaws[fightIdx];
			if (fightPullRaw && Fights.ValidateFight(fightPullRaw)) {
				const dungeonPull = fightPullRaw.dungeonPulls[dungeonPullIdx];
				if (dungeonPull) {
					// fightIdx and dungeonPullIdx denote a valid pull
					appState.fightIdx = fightIdx;
					appState.dungeonPullIdx = dungeonPullIdx;
					currentFightPullRaw = fightPullRaw;
					currentDungeonPullRaw = dungeonPull;
					return;
				}
			}
		}

		appState.fightIdx = -1;
		appState.dungeonPullIdx = -1;
		currentFightPullRaw = null;
		currentDungeonPullRaw = null;
	}
	async function fetchLog(newCode: string, fightIdx = -1, dungeonPullIdx = -1) {
		appState.api.status = OApiStatus.busy;
		return Log.build(newCode)
			.then((l) => {
				log = l;
				appState.api.status = OApiStatus.succeeded;
				appState.code = newCode;
				appState.pushCodeToHistory(l);

				selectDungeonPull(fightIdx, dungeonPullIdx);
			})
			.catch((err) => {
				console.log(err);
				appState.api.status = OApiStatus.failed;
			});
	}
	async function handleSubmit() {
		appState.api.status = OApiStatus.busy;
		if (codeInputFormValue.length < 5) {
			appState.api.status = OApiStatus.failed;
			return;
		}
		if (log && codeInputFormValue == log.code) {
			appState.api.status = OApiStatus.succeeded;
			selectDungeonPull(appState.fightIdx, appState.dungeonPullIdx);
			return;
		}
		if (!log && codeInputFormValue == appState.code) {
			fetchLog(codeInputFormValue, appState.fightIdx, appState.dungeonPullIdx);
		} else {
			fetchLog(codeInputFormValue);
		}
	}
	async function submitCode(newCode: string) {
		console.log('submitCode', newCode);
		if (codeInputFormValue !== newCode) codeInputFormValue = newCode;
		handleSubmit();
	}
	async function submitMostRecentCode() {
		const codes = appState.history.items;
		submitCode(codes?.[codes.length - 1].code ?? '');
	}
	onMount(() => {
		appState.validateSettings();
		const codeFromUrl = urlParams.get('code');

		const toNumber = (s: string | null) => {
			if (!s) return -1;
			const n = parseInt(s);
			return isNaN(n) ? -1 : n;
		};
		console.log('codeFromUrl', codeFromUrl);
		if (codeFromUrl) {
			submitCode(codeFromUrl).then(() => {
				if (appState.api.status === OApiStatus.succeeded) {
					selectDungeonPull(
						toNumber(urlParams.get('fightIdx')),
						toNumber(urlParams.get('dungeonPullIdx'))
					);
				} else {
					submitMostRecentCode();
				}
			});
		} else {
			submitMostRecentCode();
		}
	});

	let events = $state(new EventsClass());
	$effect(() => {
		if (!currentDungeonPullRaw) {
			events.clear();
		} else {
			appState.api.status = OApiStatus.busy;
			log
				?.analyzePull(currentDungeonPullRaw, { progressCallback })
				.then((e) => {
					events = e;
					appState.api.status = OApiStatus.succeeded;
				})
				.catch((err) => {
					console.log(err);
					appState.api.status = OApiStatus.failed;
				});
		}
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
	{#if log?.fights?.json}
		<div class="flex flex-1 overflow-hidden">
			{#if visibility.outline}
				<div class="w-84 flex-none overflow-y-auto">
					<OutlineView
						code={appState.code}
						fightsRaw={log.fights.json}
						currentFightIdx={appState.fightIdx}
						currentDungeonPullIdx={appState.dungeonPullIdx}
						onUpdate={selectDungeonPull}
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
				{#if appState.api.status == OApiStatus.busy}
					<LoadingScreen current={progress.current} total={progress.total} />
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<p class="text-2xl font-bold">Welcome to Log Analyzer for Mythic Plus.</p>
				<p class="text-lg">Enter a Warcraft Logs code to get started.</p>
			</div>
		</div>
	{/if}
</div>
