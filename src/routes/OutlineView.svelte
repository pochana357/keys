<script lang="ts">
	import Fights from '$lib/api/Fights.svelte';
	import { type FightsRaw } from '$lib/api/wclTypes';
	import { formatAbsoluteTime, formatTime } from '$lib/utils/utils';
	import WithTooltip from '$lib/WithTooltip.svelte';
	type Props = {
		code: string;
		fightsRaw: FightsRaw;
		currentFightIdx: number;
		currentDungeonPullIdx: number;
		onUpdate: (fightIdx: number, dungeonPullIdx: number) => void;
	};
	let { code, fightsRaw, currentFightIdx, currentDungeonPullIdx, onUpdate }: Props = $props();
</script>

<div class="py-2 pr-1 pl-2">
	<div class="text-sm italic">Only M+ fights are shown.</div>
	{#each fightsRaw.fights as fight, i (fight.id)}
		{#if Fights.ValidateFight(fight)}
			<div class="py-2 {i === currentFightIdx ? 'bg-primary-600' : ''}">
				<div class="flex gap-2">
					<img
						src="https://assets.rpglogs.com/img/warcraft/bosses/{fight.boss}-icon.jpg"
						alt={fight.zoneName}
					/>
					<div>
						<p>
							<a
								href="https://www.warcraftlogs.com/reports/{code}#fight={fight.id}&translate=true"
								target="_blank"
								><span class="text-sm text-slate-300">#{fight.id}</span>
								{fight.zoneName} +{fight.keystoneLevel}</a
							>
						</p>
						<p class="pt-1 text-sm text-slate-300">
							{formatAbsoluteTime(fightsRaw.start + fight.start_time)}
							({formatTime(fight.end_time, fight.start_time, 0)})
						</p>
					</div>
				</div>
				{#each fight.dungeonPulls as pull, j (pull)}
					<button
						class="block w-full text-left {i === currentFightIdx && j === currentDungeonPullIdx
							? 'bg-secondary-600 font-bold'
							: ''}"
						onclick={() => {
							onUpdate(i, j);
						}}
					>
						{#if pull.boss}
							<WithTooltip tooltip={pull.boss ? `Boss #${pull.boss}` : ''}>
								<!-- We use `j+1` instead of `pull.id` to match the url scheme of WCL. -->
								<span class="text-sm text-slate-300">#{j + 1}</span>
								💀{pull.name}
								<span class="text-sm text-slate-300"
									>+{formatTime(pull.start_time, fight.start_time, 0)}
									({formatTime(pull.end_time, pull.start_time, 0)})</span
								>
							</WithTooltip>
						{:else}
							<span class="text-sm text-slate-300">#{j + 1}</span>
							{pull.name}
							<span class="text-sm text-slate-300"
								>+{formatTime(pull.start_time, fight.start_time, 0)}
								({formatTime(pull.end_time, pull.start_time, 0)})</span
							>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	{/each}
</div>
