<script lang="ts">
  import type { BuffEvent, CastEvent, DebuffEvent } from '$lib/api/wclTypes';
  import {
    castBlackList,
    castDict,
    spelllikeBuffs,
    spelllikeDebuffs,
  } from '$lib/appData';
  import AbilityIcon from '$lib/AbilityIcon.svelte';
  import Timeline, { type Icon } from '$lib/Timeline.svelte';
  import UnitName from '$lib/UnitName.svelte';
  import { formatTime } from '$lib/utils/utils';

  type Props = {
    castEventsBySource: CastEvent[];
    castEventsByTarget?: CastEvent[];
    buffEvents?: BuffEvent[];
    debuffEvents?: DebuffEvent[];
    showMinor: boolean;
    showReceived: boolean;
    width: number;
    cursor: number | null;
    options: {
      referenceTime?: number;
      offsetX?: (timestamp: number) => number;
    };
  };
  let {
    castEventsBySource,
    castEventsByTarget = [],
    buffEvents = [],
    debuffEvents = [],
    showMinor,
    showReceived,
    width,
    cursor = $bindable(null),
    options = {},
  }: Props = $props();

  let referenceTime = $derived(options.referenceTime ?? 0);

  const event2icon = (event: CastEvent) => ({
    timestamp: event.timestamp,
    data: event,
  });

  const isMinor = (event: CastEvent) =>
    castDict[event.ability.guid]?.minor ?? false;

  let majorCastIcons = $derived(
    castEventsBySource
      .filter((event) => !isMinor(event))
      .map((event) => event2icon(event)),
  );
  let minorCastIcons = $derived(
    castEventsBySource
      .filter((event) => isMinor(event))
      .map((event) => event2icon(event)),
  );
  let receivedCastIcons = $derived(
    castEventsByTarget
      .filter((event) => !castBlackList.AoEHeals.includes(event.ability.guid))
      .map((event) => event2icon(event)),
  );

  let spelllikeBuffIcons = $derived(
    buffEvents
      .filter(
        (event) =>
          spelllikeBuffs[event.ability.guid] !== undefined &&
          ['applybuff', 'applybuffstack', 'refreshbuff'].includes(event.type),
      )
      .map((event) => event2icon(event)),
  );

  let spelllikeDebuffIcons = $derived(
    debuffEvents
      .filter(
        (event) =>
          spelllikeDebuffs[event.ability.guid] !== undefined &&
          ['applydebuff', 'applydebuffstack', 'refreshdebuff'].includes(
            event.type,
          ),
      )
      .map((event) => event2icon(event)),
  );

  let minorIcons = $derived.by(() => {
    const icons = [
      ...minorCastIcons,
      ...spelllikeBuffIcons,
      ...spelllikeDebuffIcons,
    ];
    icons.sort((a, b) => a.timestamp - b.timestamp);
    return icons;
  });
</script>

{#snippet contentRenderer(icon: Icon<CastEvent>)}
  {@const event = icon.data}
  <AbilityIcon ability={event.ability} />
{/snippet}
{#snippet receivedContentRenderer(icon: Icon<CastEvent>)}
  {@const event = icon.data}
  <AbilityIcon ability={event.ability} classes="grayscale-[50%]" />
{/snippet}
{#snippet detailsRenderer(icon: Icon<CastEvent>, referenceTime: number)}
  {@const event = icon.data}
  <div class="text-center">
    <p>
      {formatTime(icon.timestamp, referenceTime)}
      {event.ability.name}
      <span class="text-sm text-slate-300">(#{event.ability.guid})</span>
    </p>
    <p>
      <UnitName unit={event.source} />
      {#if event.target}
        ▶ <UnitName unit={event.target} />
      {/if}
    </p>
  </div>
{/snippet}
<div class="w-full bg-slate-700" style:width="{width}px">
  <Timeline
    datatype="spellIcon"
    icons={majorCastIcons}
    {contentRenderer}
    {detailsRenderer}
    options={{ referenceTime, offsetX: options.offsetX }}
    bind:cursor
  />
</div>

{#if showMinor && minorIcons.length > 0}
  <div class="w-full bg-slate-600" style:width="{width}px">
    <Timeline
      datatype="spellIcon"
      icons={minorIcons}
      {contentRenderer}
      {detailsRenderer}
      options={{ referenceTime, offsetX: options.offsetX }}
      bind:cursor
    />
  </div>
{/if}

{#if showReceived && receivedCastIcons.length > 0}
  <div class="w-full bg-slate-500" style:width="{width}px">
    <Timeline
      datatype="spellIcon"
      icons={receivedCastIcons}
      contentRenderer={receivedContentRenderer}
      {detailsRenderer}
      options={{ referenceTime, offsetX: options.offsetX }}
      bind:cursor
    />
  </div>
{/if}
