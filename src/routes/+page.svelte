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
				appState.pushCode(code);
			})
			.catch((err) => {
				console.log(err);
				appState.api.status = OApiStatus.failed;
			});
	}
	onMount(() => {
		const codes = appState.history.codes;
		codeFormValue = codes?.[codes.length - 1] ?? '';
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
				?.analyzePull(pullRaw)
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
</script>

<form
	class=""
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<div class="align-center flex h-10 gap-1 text-center leading-10">
		<div class="w-20 flex-none font-bold">Code</div>
		<input
			class="input"
			name="description"
			type="text"
			placeholder="(e.g., 6awx1JdH28CG94gq)"
			bind:value={codeFormValue}
		/>
		<button
			type="button"
			class="btn h-10 w-20 font-bold preset-filled-primary-950-50"
			onclick={() => handleSubmit()}
			disabled={appState.isBusy()}
		>
			{#if appState.isBusy()}
				<IconHourglass />
			{:else if appState.api.status == 'failed'}
				<IconX />
			{:else if appState.api.status == 'succeeded'}
				<IconCheck />
			{:else}
				Go
			{/if}
		</button>
	</div>
	<div class="align-center flex gap-1 text-center">
		<div class="h-10 w-20 flex-none font-bold leading-10">History</div>
		<div>
			{#each [...appState.history.codes].reverse() as c (c)}
				<button
					type="button"
					class="block"
					class:font-bold={c == code}
					onclick={() => {
						codeFormValue = c;
						handleSubmit();
					}}
				>
					{c}
				</button>
			{/each}
		</div>
	</div>
</form>
<hr />
{#if log?.fights?.json}
	<div class="flex">
		<div class="w-84 flex-none">
			<OutlineView fightsRaw={log.fights.json} bind:currentFightIdx bind:currentDungeonPullIdx />
		</div>
		<div>
			{#if pullRaw}
				<EventViewer {events} />
			{/if}
		</div>
	</div>
{/if}
