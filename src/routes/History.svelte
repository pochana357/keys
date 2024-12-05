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
		const testCodes = [
			'4KxdFT6pVYLfy7r2', // Rogue, Stonevault
			'19qd8m6CcjHbkZD3', // Mage
			'6awx1JdH28CG94gq', // Rogue, Necrotic Wake
			'HZLwh46mFCD1Xdzk', // Druid, Siege of Boralus
			'xZ8Vytqp1XQAnTYm', // Restoration Shaman
			'3M46dqmjTnWKahwB' // Retribution Paladin, Dawnbreaker
		];
		const testCode = testCodes[Math.floor(Math.random() * testCodes.length)];
		submitCode(testCode);
	}
	async function clearHistory() {
		appState.clearHistory();
	}
</script>

<div class="align-center flex h-max gap-1">
	<div class="h-10 w-20 flex-none text-center font-bold leading-10">History</div>
	<div class="line-nowrap flex-1 overflow-x-clip text-nowrap border pb-2 pl-3">
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
	</div>
</div>
