<script lang="ts">
	import IconHourglass from 'lucide-svelte/icons/hourglass';
	// import IconX from 'lucide-svelte/icons/circle-x';
	// import IconCheck from 'lucide-svelte/icons/circle-check';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	import IconHistory from 'lucide-svelte/icons/history';
	import IconSettings from 'lucide-svelte/icons/settings';
	import type { PullRaw } from '$lib/api/wclTypes';
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

	let log: Log | null = $state(null);
	let code = $state('');
	let codeFormValue = $state('');
	let appState = new AppState();
	let settings = $derived(appState.settings);
	async function handleSubmit() {
		appState.api.status = OApiStatus.busy;
		if (codeFormValue.length < 5) {
			appState.api.status = OApiStatus.failed;
			return;
		}
		if (codeFormValue == code) {
			appState.api.status = OApiStatus.succeeded;
			return;
		}
		Log.build(codeFormValue)
			.then((l) => {
				log = l;
				appState.api.status = OApiStatus.succeeded;
				code = codeFormValue;
				currentFightIdx = -1;
				currentDungeonPullIdx = -1;
				appState.pushCode(l);
			})
			.catch((err) => {
				console.log(err);
				appState.api.status = OApiStatus.failed;
			});
	}
	const submitCode = (newCode: string) => {
		codeFormValue = newCode;
		handleSubmit();
	};
	onMount(() => {
		appState.validateSettings();
		const codes = appState.history.items;
		submitCode(codes?.[codes.length - 1].code ?? '');
	});

	let currentFightIdx = $state(-1); // dbg: 41
	let currentDungeonPullIdx = $state(-1); // dbg: 16

	let pullRaw: PullRaw | null = $derived.by(() => {
		const fightPullRaw = log?.fights?.json?.fights;
		if (fightPullRaw && currentFightIdx >= 0 && currentDungeonPullIdx >= 0) {
			return fightPullRaw[currentFightIdx].dungeonPulls?.[currentDungeonPullIdx] ?? null;
		}
		return null;
	});

	let events = $state(new EventsClass());
	$effect(() => {
		if (!pullRaw) {
			events.clear();
		} else {
			appState.api.status = OApiStatus.busy;
			log
				?.analyzePull(pullRaw, { progressCallback })
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

	let showHistory = $state(false);
	let showSettings = $state(false);
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
				bind:value={codeFormValue}
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
					onclick={() => (showHistory = !showHistory)}
				>
					<IconHistory />
				</button>
				<button
					type="button"
					class="w-15 h-10 flex-none px-1 font-bold hover:text-primary-200"
					onclick={() => (showSettings = !showSettings)}
				>
					<IconSettings />
				</button>
			</div>
		</div>
		{#if showHistory}
			<History currentCode={code} {submitCode} />
		{/if}
	</form>
	{#if showSettings}
		<div class="align-center flex h-max gap-1">
			<div class="h-10 w-20 flex-none text-center font-bold leading-10">Settings</div>
			<div class="flex-1 overflow-x-clip border py-2 pl-3">
				<SettingsComponent
					bind:pxPerSec={settings.pxPerSec}
					bind:horizontalOverlap={settings.horizontalOverlap}
					bind:pxPerLevel={settings.pxPerLevel}
					bind:showMinors={settings.showMinors}
					defaultSettings={AppState.defaultSettings}
				/>
			</div>
		</div>
	{/if}
	{#if log?.fights?.json}
		<div class="flex flex-1 overflow-hidden">
			<div class="w-84 flex-none overflow-y-auto">
				<OutlineView
					{code}
					fightsRaw={log.fights.json}
					bind:currentFightIdx
					bind:currentDungeonPullIdx
				/>
			</div>
			<div class="relative flex-1 overflow-x-auto">
				{#if pullRaw}
					<EventViewer {events} />
				{:else}
					<div class="p-2 text-center text-lg">
						Select a pull on the left panel to view timelines.
					</div>
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
