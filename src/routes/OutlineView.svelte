<script lang="ts">
	import { type FightsRaw } from '$lib/api/wclTypes';
	import { formatAbsoluteTime, formatTime } from '$lib/utils';
	import WithTooltip from '$lib/WithTooltip.svelte';
	type Props = { fightsRaw: FightsRaw; currentFightIdx: number; currentDungeonPullIdx: number };
	let {
		fightsRaw: fightRaw,
		currentFightIdx = $bindable(-1),
		currentDungeonPullIdx = $bindable(-1)
	}: Props = $props();

	function selectPull(i: number, j: number) {
		currentFightIdx = i;
		currentDungeonPullIdx = j;
	}
</script>

<div class="py-2 pl-2 pr-1">
	<div class="text-sm italic">Only M+ fights are shown.</div>
	{#each fightRaw.fights as fight, i (fight.id)}
		{#if fight.keystoneLevel && fight.dungeonPulls}
			<div class="py-2 {i === currentFightIdx ? 'bg-primary-600' : ''}">
				<div class="flex gap-2">
					<img
						src="https://assets.rpglogs.com/img/warcraft/bosses/{fight.boss}-icon.jpg"
						alt={fight.zoneName}
					/>
					<div>
						<p>#{fight.id} {fight.zoneName} +{fight.keystoneLevel}</p>
						<p class="pl-1 pt-1 text-sm text-slate-300">
							{formatAbsoluteTime(fightRaw.start + fight.start_time)}
							({formatTime(fight.end_time, fight.start_time, 0)})
						</p>
					</div>
				</div>
				{#each fight.dungeonPulls as pull, j (pull)}
					<button
						class="block w-full text-left {i === currentFightIdx && j === currentDungeonPullIdx
							? 'bg-secondary-600 font-bold'
							: ''}"
						onclick={() => selectPull(i, j)}
					>
						{#if pull.boss}
							<WithTooltip tooltip={pull.boss ? `Boss #${pull.boss}` : ''}>
								#{pull.id} 💀 {pull.name}
								{formatTime(pull.end_time, pull.start_time, 0)}
							</WithTooltip>
						{:else}
							#{pull.id} {pull.name} {formatTime(pull.end_time, pull.start_time, 0)}
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	{/each}
</div>
