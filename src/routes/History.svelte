<script lang="ts">
	import { getAppState } from '$lib/AppState';
	import { formatAbsoluteTime } from '$lib/utils/utils';

	const appState = getAppState();
	type Props = {
		currentCode: string;
		submitCode: (code: string) => void;
	};
	let { currentCode, submitCode }: Props = $props();
	async function handleTest() {
		const testCodes = ['jrXvdZNRFP2WhyAG', '2BcdTkFCbPq78DjK', 'fT3dFVzKq6Dg4MGc']; // Random logs in TWW S3
		const testCode = testCodes[Math.floor(Math.random() * testCodes.length)];
		submitCode(testCode);
	}
	async function clearHistory() {
		appState.clearHistory();
	}
</script>

<div class="align-center flex h-max gap-1 pr-2">
	<div class="h-10 w-20 flex-none text-center leading-10 font-bold">History</div>
	<div class="line-nowrap flex-1 overflow-x-clip rounded-sm border pb-2 pl-3 text-nowrap">
		{#each [...appState.history.items].reverse() as item (item.code)}
			<button
				type="button"
				class="block pt-2"
				class:font-bold={item.code == currentCode}
				onclick={() => {
					submitCode(item.code);
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
			class="btn preset-filled-primary-700-300 h-10 font-bold"
			onclick={() => handleTest()}
		>
			Test
		</button>
		<button
			type="button"
			class="btn preset-filled-primary-700-300 h-10 font-bold"
			onclick={() => clearHistory()}
		>
			Clear
		</button>
	</div>
</div>
