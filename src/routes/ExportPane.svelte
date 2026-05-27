<script lang="ts">
  import IconChevronDown from 'lucide-svelte/icons/chevron-down';
  import IconChevronRight from 'lucide-svelte/icons/chevron-right';
  import IconCopy from 'lucide-svelte/icons/copy';
  import IconEye from 'lucide-svelte/icons/eye';
  import IconFileText from 'lucide-svelte/icons/file-text';
  import IconMinus from 'lucide-svelte/icons/minus';
  import IconPlus from 'lucide-svelte/icons/plus';
  import IconRotateCcw from 'lucide-svelte/icons/rotate-ccw';
  import AbilityIcon from '$lib/AbilityIcon.svelte';
  import WithTooltip from '$lib/WithTooltip.svelte';
  import {
    buildMrtNoteModel,
    buildMrtNote,
    defaultAttachWindowMs,
    defensiveClassColor,
    defensiveLabel,
    formatDamageLabel,
    formatMrtTime,
    type ExportDamageSelection,
    type ExportDefensiveSelection,
  } from '$lib/export/mrtNote';
  import {
    buildSelectionGroups,
    buildUnselectedSelectionGroups,
    defensiveSelectionCategory,
    type DefensiveSelectionCategory,
    type SelectionGroup,
  } from '$lib/export/exportSelection';
  import {
    defaultExportLanguage,
    getSpellAbbreviation,
    type ExportLanguage,
  } from '$lib/export/spellAbbreviations';

  type Props = {
    damageSelections: ExportDamageSelection[];
    defensiveSelections: ExportDefensiveSelection[];
    damageCandidates: ExportDamageSelection[];
    defensiveCandidates: ExportDefensiveSelection[];
    referenceTime: number;
    damageGroupIntervalMs: number;
    encounterId?: number;
    exportLanguage: ExportLanguage;
    onSetDamageSpellIdSelected: (spellId: number, selected: boolean) => void;
    onSetDefensiveSpellIdSelected: (spellId: number, selected: boolean) => void;
    onResetDefensiveSelections: () => void;
  };

  let {
    damageSelections,
    defensiveSelections,
    damageCandidates,
    defensiveCandidates,
    referenceTime,
    damageGroupIntervalMs,
    encounterId,
    exportLanguage = $bindable(defaultExportLanguage),
    onSetDamageSpellIdSelected,
    onSetDefensiveSpellIdSelected,
    onResetDefensiveSelections,
  }: Props = $props();

  let attachWindowSeconds = $state(defaultAttachWindowMs / 1000);
  let copyStatus = $state('');
  let noteView = $state<'preview' | 'raw'>('preview');
  let damageExpanded = $state(false);
  let defensiveExpanded = $state(false);
  let attachWindowMs = $derived(
    Number.isFinite(attachWindowSeconds)
      ? Math.max(0, attachWindowSeconds * 1000)
      : defaultAttachWindowMs,
  );
  let noteText = $derived(
    buildMrtNote(damageSelections, defensiveSelections, {
      referenceTime,
      attachWindowMs,
      damageGroupIntervalMs,
      encounterId,
      language: exportLanguage,
    }),
  );
  let noteModel = $derived(
    buildMrtNoteModel(damageSelections, defensiveSelections, {
      referenceTime,
      attachWindowMs,
      damageGroupIntervalMs,
      encounterId,
      language: exportLanguage,
    }),
  );
  let selectedDamageGroups = $derived(buildSelectionGroups(damageSelections));
  let unselectedDamageGroups = $derived(
    buildUnselectedSelectionGroups(damageSelections, damageCandidates),
  );
  let selectedDefensiveGroups = $derived(
    buildSelectionGroups(defensiveSelections),
  );
  let unselectedDefensiveGroups = $derived(
    buildUnselectedSelectionGroups(defensiveSelections, defensiveCandidates),
  );

  async function copyNote() {
    if (!noteText) return;
    try {
      await navigator.clipboard.writeText(noteText);
      copyStatus = 'Copied';
    } catch {
      copyStatus = 'Copy failed';
    }
    window.setTimeout(() => {
      copyStatus = '';
    }, 1200);
  }

  function formatPreviewTime(timestamp: number) {
    return formatMrtTime(timestamp, referenceTime).slice(6, -1);
  }

  function sectionCount(selectedCount: number, totalCount: number) {
    return selectedCount === totalCount
      ? String(selectedCount)
      : `${selectedCount}/${totalCount}`;
  }
</script>

{#snippet defensiveBadge(category: DefensiveSelectionCategory)}
  <span
    class="rounded-sm border px-1.5 py-0.5 text-[10px] leading-none font-bold"
    class:border-sky-400={category === 'major'}
    class:bg-sky-950={category === 'major'}
    class:text-sky-100={category === 'major'}
    class:border-surface-500={category === 'minor'}
    class:bg-surface-800={category === 'minor'}
    class:text-surface-100={category === 'minor'}
    class:border-amber-400={category === 'offensive'}
    class:bg-amber-950={category === 'offensive'}
    class:text-amber-100={category === 'offensive'}
  >
    {category}
  </span>
{/snippet}

{#snippet defensiveName(defensive: ExportDefensiveSelection)}
  <span style:color={`#${defensiveClassColor(defensive)}`}>
    {defensiveLabel(defensive, exportLanguage)}
  </span>
{/snippet}

{#snippet groupActionButton(
  selected: boolean,
  label: string,
  onclick: () => void,
)}
  <WithTooltip tooltip={label} placement="left">
    <button
      type="button"
      class="btn h-7 w-7 flex-none p-0"
      aria-label={label}
      {onclick}
    >
      {#if selected}
        <IconMinus size={15} />
      {:else}
        <IconPlus size={15} />
      {/if}
    </button>
  </WithTooltip>
{/snippet}

{#snippet damageGroupRow(
  group: SelectionGroup<ExportDamageSelection>,
  selected: boolean,
)}
  <div
    class="flex items-center justify-between gap-2 py-1"
    class:opacity-50={!selected}
  >
    <span class="flex min-w-0 items-center gap-1.5">
      <AbilityIcon ability={group.ability} classes="inline-block" />
      <span class="truncate">{group.ability.name}</span>
    </span>
    {@render groupActionButton(
      selected,
      selected ? 'Remove damage spell' : 'Add damage spell',
      () => onSetDamageSpellIdSelected(group.ability.guid, !selected),
    )}
  </div>
{/snippet}

{#snippet defensiveGroupRow(
  group: SelectionGroup<ExportDefensiveSelection>,
  selected: boolean,
)}
  {@const category = defensiveSelectionCategory(group.selections[0])}
  <div
    class="flex items-center justify-between gap-2 py-1"
    class:opacity-50={!selected}
  >
    <span class="flex min-w-0 items-center gap-1.5">
      <AbilityIcon ability={group.ability} classes="inline-block" />
      <span class="truncate">
        {getSpellAbbreviation(group.ability, exportLanguage)}
      </span>
      {@render defensiveBadge(category)}
    </span>
    {@render groupActionButton(
      selected,
      selected ? 'Remove defensive spell' : 'Add defensive spell',
      () => onSetDefensiveSpellIdSelected(group.ability.guid, !selected),
    )}
  </div>
{/snippet}

<aside class="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3">
  <h2 class="text-lg font-bold">Export</h2>

  <label class="flex items-center justify-between gap-2 text-sm">
    <span>Attach window</span>
    <span class="flex items-center gap-2">
      <input
        class="input h-9 w-20 py-1 text-right"
        type="number"
        min="0"
        step="1"
        bind:value={attachWindowSeconds}
      />
      <span class="text-surface-300">s</span>
    </span>
  </label>

  <label class="flex items-center justify-between gap-2 text-sm">
    <span>Language</span>
    <span class="border-surface-600 inline-flex rounded-sm border p-0.5">
      <button
        type="button"
        class="h-8 w-12 rounded-sm text-sm font-bold"
        class:bg-primary-700={exportLanguage === 'ko'}
        class:text-primary-50={exportLanguage === 'ko'}
        class:text-surface-300={exportLanguage !== 'ko'}
        aria-pressed={exportLanguage === 'ko'}
        onclick={() => (exportLanguage = 'ko')}
      >
        KO
      </button>
      <button
        type="button"
        class="h-8 w-12 rounded-sm text-sm font-bold"
        class:bg-primary-700={exportLanguage === 'en'}
        class:text-primary-50={exportLanguage === 'en'}
        class:text-surface-300={exportLanguage !== 'en'}
        aria-pressed={exportLanguage === 'en'}
        onclick={() => (exportLanguage = 'en')}
      >
        EN
      </button>
    </span>
  </label>

  <div class="flex items-center justify-between gap-2">
    <h3 class="font-bold">{noteView === 'raw' ? 'MRT note' : 'Preview'}</h3>
    <div class="flex items-center gap-2">
      {#if copyStatus}
        <span class="text-surface-300 text-xs">{copyStatus}</span>
      {/if}
      <WithTooltip tooltip="Preview" placement="bottom">
        <button
          type="button"
          class={`btn h-9 w-9 p-0 ${noteView === 'preview' ? 'preset-filled-primary-700-300' : ''}`}
          aria-label="Show rendered preview"
          aria-pressed={noteView === 'preview'}
          onclick={() => (noteView = 'preview')}
        >
          <IconEye size={18} />
        </button>
      </WithTooltip>
      <WithTooltip tooltip="MRT note" placement="bottom">
        <button
          type="button"
          class={`btn h-9 w-9 p-0 ${noteView === 'raw' ? 'preset-filled-primary-700-300' : ''}`}
          aria-label="Show raw MRT note"
          aria-pressed={noteView === 'raw'}
          onclick={() => (noteView = 'raw')}
        >
          <IconFileText size={18} />
        </button>
      </WithTooltip>
      <WithTooltip tooltip="Copy" placement="bottom">
        <button
          type="button"
          class="btn h-9 w-9 p-0"
          aria-label="Copy MRT note"
          onclick={copyNote}
          disabled={!noteText}
        >
          <IconCopy size={18} />
        </button>
      </WithTooltip>
    </div>
  </div>

  {#if noteView === 'raw'}
    <textarea
      class="textarea h-[62vh] min-h-72 resize-y overflow-y-auto font-mono text-xs"
      readonly
      value={noteText}
    ></textarea>
  {:else}
    <div
      class="border-surface-600 h-[62vh] min-h-72 overflow-y-auto rounded-sm border p-2 pr-1 text-sm"
    >
      <div class="space-y-1">
        {#if noteModel.encounterId}
          <p class="text-surface-300 font-mono">
            {`{e:${noteModel.encounterId}}`}
          </p>
        {/if}
        {#each noteModel.rows as row (row.key)}
          <p class="flex flex-wrap items-center gap-1 leading-6">
            <span class="text-surface-300 font-mono">
              {formatPreviewTime(row.timestamp)}
            </span>
            {#if row.damage}
              <span>
                {formatDamageLabel(row.damage, row.damageEventNumber ?? 1)}
              </span>
              <AbilityIcon
                ability={row.damage.ability}
                classes="inline-block"
              />
            {/if}
            {#if row.defensives.length > 0}
              <span class="text-surface-400 font-mono">-</span>
            {/if}
            {#each row.defensives as defensive (defensive.key)}
              <span class="inline-flex items-center gap-1">
                {@render defensiveName(defensive)}
                <AbilityIcon
                  ability={defensive.ability}
                  classes="inline-block"
                />
              </span>
            {/each}
          </p>
        {/each}
        {#if noteModel.encounterId}
          <p class="text-surface-300 font-mono">{'{/e}'}</p>
        {/if}
      </div>
    </div>
  {/if}

  <div class="text-sm">
    <div class="mb-3">
      <button
        type="button"
        class="hover:text-primary-200 mb-1 flex w-full items-center gap-1 text-left font-bold"
        aria-expanded={damageExpanded}
        onclick={() => (damageExpanded = !damageExpanded)}
      >
        {#if damageExpanded}
          <IconChevronDown size={16} />
        {:else}
          <IconChevronRight size={16} />
        {/if}
        <span>
          Damage ({sectionCount(
            selectedDamageGroups.length,
            selectedDamageGroups.length + unselectedDamageGroups.length,
          )})
        </span>
      </button>
      {#if damageExpanded}
        {#each selectedDamageGroups as group (group.ability.guid)}
          {@render damageGroupRow(group, true)}
        {/each}
        {#each unselectedDamageGroups as group (group.ability.guid)}
          {@render damageGroupRow(group, false)}
        {/each}
      {/if}
    </div>

    <div>
      <div class="mb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          class="hover:text-primary-200 flex min-w-0 flex-1 items-center gap-1 text-left font-bold"
          aria-expanded={defensiveExpanded}
          onclick={() => (defensiveExpanded = !defensiveExpanded)}
        >
          {#if defensiveExpanded}
            <IconChevronDown size={16} />
          {:else}
            <IconChevronRight size={16} />
          {/if}
          <span class="truncate">
            Defensives ({sectionCount(
              selectedDefensiveGroups.length,
              selectedDefensiveGroups.length + unselectedDefensiveGroups.length,
            )})
          </span>
        </button>
        <WithTooltip tooltip="Reset defensives" placement="left">
          <button
            type="button"
            class="btn h-8 w-8 p-0"
            aria-label="Reset defensive selections"
            onclick={onResetDefensiveSelections}
            disabled={defensiveCandidates.length === 0}
          >
            <IconRotateCcw size={16} />
          </button>
        </WithTooltip>
      </div>
      {#if defensiveExpanded}
        {#each selectedDefensiveGroups as group (group.ability.guid)}
          {@render defensiveGroupRow(group, true)}
        {/each}
        {#each unselectedDefensiveGroups as group (group.ability.guid)}
          {@render defensiveGroupRow(group, false)}
        {/each}
      {/if}
    </div>
  </div>
</aside>
