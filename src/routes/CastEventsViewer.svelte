<script lang="ts">
  import type { BuffEvent, CastEvent, DebuffEvent } from '$lib/api/wclTypes';
  import {
    defensiveSelectionKey,
    type DefensiveSelectionRowKind,
    type ExportDefensiveSelection,
    toExportDefensiveSelection,
  } from '$lib/export/mrtNote';
  import AbilityIcon from '$lib/AbilityIcon.svelte';
  import Timeline, { type Icon } from '$lib/Timeline.svelte';
  import UnitName from '$lib/UnitName.svelte';
  import {
    isMajorDefensiveCast,
    isMinorDefensiveCast,
    isReceivedDefensiveCast,
    isSpelllikeBuffEvent,
    isSpelllikeDebuffEvent,
  } from '$lib/export/exportSelection';
  import {
    defaultExportLanguage,
    getSpellAbbreviation,
    type ExportLanguage,
  } from '$lib/export/spellAbbreviations';
  import { formatTime } from '$lib/utils/utils';
  import type { SvelteMap } from 'svelte/reactivity';

  type DefensiveEvent = CastEvent | BuffEvent | DebuffEvent;

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
    exportMode?: boolean;
    exportLanguage?: ExportLanguage;
    selectedDefensives?: SvelteMap<string, ExportDefensiveSelection>;
    onToggleDefensiveSelection?: (selection: ExportDefensiveSelection) => void;
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
    exportMode = false,
    exportLanguage = defaultExportLanguage,
    selectedDefensives,
    onToggleDefensiveSelection,
  }: Props = $props();

  let referenceTime = $derived(options.referenceTime ?? 0);

  const event2icon = (event: DefensiveEvent): Icon<DefensiveEvent> => ({
    timestamp: event.timestamp,
    data: event,
  });

  let majorCastIcons = $derived(
    castEventsBySource
      .filter(isMajorDefensiveCast)
      .map((event) => event2icon(event)),
  );
  let minorCastIcons = $derived(
    castEventsBySource
      .filter(isMinorDefensiveCast)
      .map((event) => event2icon(event)),
  );
  let receivedCastIcons = $derived(
    castEventsByTarget
      .filter(isReceivedDefensiveCast)
      .map((event) => event2icon(event)),
  );

  let spelllikeBuffIcons = $derived(
    buffEvents.filter(isSpelllikeBuffEvent).map((event) => event2icon(event)),
  );

  let spelllikeDebuffIcons = $derived(
    debuffEvents
      .filter(isSpelllikeDebuffEvent)
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

  function isSelected(rowKind: DefensiveSelectionRowKind) {
    return (icon: Icon<DefensiveEvent>) =>
      selectedDefensives?.has(defensiveSelectionKey(icon.data, rowKind)) ??
      false;
  }

  function toggleSelection(rowKind: DefensiveSelectionRowKind) {
    return (icon: Icon<DefensiveEvent>) => {
      if (!exportMode || !onToggleDefensiveSelection) return;
      onToggleDefensiveSelection(
        toExportDefensiveSelection(icon.data, rowKind),
      );
    };
  }
</script>

{#snippet contentRenderer(icon: Icon<DefensiveEvent>)}
  {@const event = icon.data}
  <AbilityIcon ability={event.ability} />
{/snippet}
{#snippet receivedContentRenderer(icon: Icon<DefensiveEvent>)}
  {@const event = icon.data}
  <AbilityIcon ability={event.ability} classes="grayscale-[50%]" />
{/snippet}
{#snippet detailsRenderer(icon: Icon<DefensiveEvent>, referenceTime: number)}
  {@const event = icon.data}
  {@const abilityName = exportMode
    ? getSpellAbbreviation(event.ability, exportLanguage)
    : event.ability.name}
  <div class="text-center">
    <p>
      {formatTime(icon.timestamp, referenceTime)}
      {abilityName}
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
    options={{
      referenceTime,
      offsetX: options.offsetX,
      isSelected: exportMode ? isSelected('major') : undefined,
      onToggle: exportMode ? toggleSelection('major') : undefined,
    }}
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
      options={{
        referenceTime,
        offsetX: options.offsetX,
        isSelected: exportMode ? isSelected('minor') : undefined,
        onToggle: exportMode ? toggleSelection('minor') : undefined,
      }}
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
      options={{
        referenceTime,
        offsetX: options.offsetX,
        isSelected: exportMode ? isSelected('received') : undefined,
        onToggle: exportMode ? toggleSelection('received') : undefined,
      }}
      bind:cursor
    />
  </div>
{/if}
