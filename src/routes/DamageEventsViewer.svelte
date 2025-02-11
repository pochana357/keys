<script lang="ts">
	import type { Ability, DamageTakenEvent } from '$lib/api/wclTypes';
	import Timeline, { type Icon } from '$lib/Timeline.svelte';
	import { ability2img } from '$lib/utils/link';
	import { SpellSchool } from '$lib/utils/SpellSchool';
	import { formatInteger, formatTime } from '$lib/utils/utils';
	import type { SvelteMap } from 'svelte/reactivity';

	type Props = {
		damageTakenEvents: DamageTakenEvent[];
		options: {
			damageGroupInterval?: number;
			referenceTime?: number;
			offsetX?: (timestamp: number) => number;
		};
		buffDict: SvelteMap<number, Ability>;
		cursor: number | null;
	};
	let { damageTakenEvents, options = {}, buffDict, cursor = $bindable(null) }: Props = $props();
	const defaultDamageGroupInterval = 3000;
	const damageGroupInterval = $derived(options.damageGroupInterval ?? defaultDamageGroupInterval);

	let referenceTime = $derived(options.referenceTime ?? 0);

	// Group damage events with the same spell id if they are close enough.
	// Grouped events are displayed in the same row in the timeline even when their icons overlap.
	let mergeGroups = $derived.by(() => {
		// lastTimestamps[spellId] stores the last timestamp of the damage event.
		const lastTimestamps = new Map<number, { mergeDataIdx: number; timestamp: number }>();
		// each entry of mergeData stores the index of the first damage event in the merge group (firstEventIdx)
		// and the indices of the merged damage events (mergedIdxs).
		const mergeGroups: { firstEventIdx: number; mergedIdxs: number[] }[] = [];

		damageTakenEvents.forEach((e, idx) => {
			const lastTimestamp = lastTimestamps.get(e.ability.guid);
			if (lastTimestamp && e.timestamp - lastTimestamp.timestamp < damageGroupInterval) {
				// The current and the previous damage events (with the same spell id) are mergeable.
				mergeGroups[lastTimestamp.mergeDataIdx].mergedIdxs.push(idx);
				lastTimestamp.timestamp = e.timestamp;
			} else {
				// The current damage begins a new merge group.
				mergeGroups.push({ firstEventIdx: idx, mergedIdxs: [] });
				lastTimestamps.set(e.ability.guid, {
					mergeDataIdx: mergeGroups.length - 1,
					timestamp: e.timestamp
				});
			}
		});

		return mergeGroups;
	});

	let icons = $derived(
		damageTakenEvents.map((event) => ({
			timestamp: event.timestamp,
			data: event,
			emphasisLevel: event.overkill && event.overkill >= 0 ? 99 : 0
		}))
	);
</script>

{#snippet formatAbilityName(ability: Ability)}
	{@const abilityTextColor = SpellSchool.getColor(ability.type)}

	{#if abilityTextColor}
		<span style:color={abilityTextColor}>{ability.name}</span>
	{:else}
		{ability.name}
	{/if}
{/snippet}
{#snippet contentRenderer(icon: Icon<DamageTakenEvent>)}
	{@const event = icon.data}
	{@html ability2img(event.ability)}
{/snippet}
{#snippet detailsRenderer(icon: Icon<DamageTakenEvent>, referenceTime: number)}
	{@const event = icon.data}
	<div>
		<p class="text-center">
			{formatTime(icon.timestamp, referenceTime)}
			{@render formatAbilityName(event.ability)}
			<span class="text-sm text-slate-300">(#{event.ability.guid})</span>
		</p>
		<p>
			School:
			{#if SpellSchool.isPhysical(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Physical)}>Phys</span>
			{/if}
			{#if SpellSchool.isHoly(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Holy)}>Holy</span>
			{/if}
			{#if SpellSchool.isFire(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Fire)}>Fire</span>
			{/if}
			{#if SpellSchool.isNature(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Nature)}>Nature</span>
			{/if}
			{#if SpellSchool.isFrost(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Frost)}>Frost</span>
			{/if}
			{#if SpellSchool.isArcane(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Arcane)}>Arcane</span>
			{/if}
			{#if SpellSchool.isShadow(event.ability.type)}
				<span style:color={SpellSchool.getColor(SpellSchool.Shadow)}>Shadow</span>
			{/if}
		</p>
		<p>
			Damage taken: {formatInteger(event.amount)}
			{#if event.absorbed}
				(A: {formatInteger(event.absorbed)})
			{/if}
			{#if event.overkill}
				(O: {formatInteger(event.overkill)})
			{/if}
		</p>
		{#if event.buffs}
			<hr class="my-1" />
			<p class="font-bold">Defensive Buffs</p>
			{#each event.buffs.split('.') as buff (buff)}
				{#if buff.length > 0}
					{@const ability = buffDict.get(Number(buff))}
					{#if ability}
						<p>
							{@html ability2img(ability, 'inline-block')}
							{@render formatAbilityName(ability)}
							<span class="text-sm text-slate-300">(#{ability.guid})</span>
						</p>
						<!-- {:else}
						<p>(#{buff})</p> -->
					{/if}
				{/if}
			{/each}
		{/if}
		{#if event.amount > 0}
			<hr class="my-1" />
			<p class="font-bold">Stats</p>
			{#if event.hitPoints && event.maxHitPoints}
				<p>
					HP remaining: {formatInteger(event.hitPoints)}
					({((event.hitPoints / event.maxHitPoints) * 100.0).toFixed(2)} %)
				</p>
				<p>
					Max HP: {formatInteger(event.maxHitPoints)}
				</p>
			{/if}
			<p>Vers: {(event.versatility / 100.0).toFixed(2)}%</p>
			<p>Avoidance: {(event.avoidance / 100.0).toFixed(2)}%</p>
		{/if}
	</div>
{/snippet}
<Timeline
	datatype="spellIcon"
	{icons}
	{contentRenderer}
	{detailsRenderer}
	options={{ mergeGroups, referenceTime, offsetX: options.offsetX }}
	bind:cursor
/>
