<script lang="ts">
	import IconHourglass from 'lucide-svelte/icons/hourglass';
	// import IconX from 'lucide-svelte/icons/circle-x';
	// import IconCheck from 'lucide-svelte/icons/circle-check';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	import type { PullRaw } from '$lib/api/wclTypes';
	import { EventsClass } from '$lib/api/event';
	import Log from '$lib/api/log';
	import { onMount } from 'svelte';
	import OutlineView from './OutlineView.svelte';
	import EventViewer from './EventViewer.svelte';
	import { AppState, OApiStatus } from '$lib/settings';
	import { formatAbsoluteTime } from '$lib/utils';
	import LoadingScreen from './LoadingScreen.svelte';

	let log: Log | null = $state(null);
	let code = $state('');
	let codeFormValue = $state('');
	let appState = new AppState();
	async function handleSubmit() {
		appState.api.status = OApiStatus.busy;
		if (codeFormValue.length < 5) {
			appState.api.status = OApiStatus.failed;
			return;
		}
		if (codeFormValue == code) {
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
	async function handleTest() {
		const testCodes = [
			'19qd8m6CcjHbkZD3',
			'XvVTQ3WhndZGc6Na',
			'6awx1JdH28CG94gq',
			'A3fkrxdQBqnHp2JR'
		];
		const testCode = testCodes[Math.floor(Math.random() * testCodes.length)];
		codeFormValue = testCode;
		handleSubmit();
	}
	async function clearHistory() {
		appState.clearHistory();
	}
	onMount(() => {
		const codes = appState.history.items;
		codeFormValue = codes?.[codes.length - 1].code ?? '';
		handleSubmit();
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
</script>

<div class="flex h-screen w-screen flex-col">
	<form
		class="flex h-48 flex-none flex-col gap-1"
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
		</div>
		<div class="align-center flex h-full gap-1 text-center">
			<div class="h-10 w-20 flex-none font-bold leading-10">History</div>
			<div class="line-nowrap flex-1 overflow-x-clip text-nowrap border pl-3">
				{#each [...appState.history.items].reverse() as item (item.code)}
					<button
						type="button"
						class="block pt-2"
						class:font-bold={item.code == code}
						onclick={() => {
							codeFormValue = item.code;
							handleSubmit();
						}}
					>
						<span class="font-mono">{item.code}</span>
						<span class="font-sm font-mono">({formatAbsoluteTime(item.timestamp)})</span>
						{#each item.exportedCharacters.slice(0, Math.min(7, item.exportedCharacters.length)) as c (c)}
							<span class="font-sm px-1">{c}</span>
						{/each}
						{#if item.exportedCharacters.length > 7}
							<span class="font-sm px-1">...</span>
						{/if}
					</button>
				{/each}
			</div>
			<div class="flex w-20 flex-none flex-col justify-between">
				<button
					type="button"
					class="btn h-10 font-bold preset-filled-primary-950-50"
					onclick={() => handleTest()}
				>
					Test
				</button>
				<button
					type="button"
					class="btn h-10 font-bold preset-filled-primary-950-50"
					onclick={() => clearHistory()}
				>
					Clear
				</button>
				<button
					type="button"
					class="btn h-10 font-bold preset-filled-primary-950-50"
					disabled={true}
				>
					Settings
				</button>
			</div>
		</div>
	</form>
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
					<div class="p-2 text-center">Select a pull on the left panel to view timelines.</div>
				{/if}
				{#if appState.api.status == OApiStatus.busy}
					<LoadingScreen current={progress.current} total={progress.total} />
				{/if}
			</div>
		</div>
	{/if}
</div>
