<script lang="ts" module>
  export type Icon<T> = { timestamp: number; data: T; emphasisLevel?: number };
</script>

<script lang="ts" generics="T">
  import { type Snippet } from 'svelte';
  import { AppState, getAppState } from '$lib/AppState';
  import WithTooltip from './WithTooltip.svelte';
  type Props = {
    datatype: 'text' | 'spellIcon';
    icons: Icon<T>[];
    contentRenderer: Snippet<[Icon<T>]>;
    detailsRenderer?: Snippet<[Icon<T>, number]>;
    options: {
      mergeGroups?: { firstEventIdx: number; mergedIdxs: number[] }[];
      referenceTime?: number;
      offsetX?: (timestamp: number) => number;
      isSelected?: (icon: Icon<T>) => boolean;
      onToggle?: (icon: Icon<T>) => void;
    };
    cursor: number | null;
  };
  let {
    datatype,
    icons,
    contentRenderer,
    detailsRenderer,
    options = {},
    cursor = $bindable(),
  }: Props = $props();
  const appState = getAppState();

  let pxPerSec = $derived(
    appState?.settings?.pxPerSec || AppState.defaultSettings.pxPerSec,
  );
  let horizontalOverlap = $derived(
    appState?.settings?.horizontalOverlap ||
      AppState.defaultSettings.horizontalOverlap,
  );
  let pxPerLevel = $derived(
    appState?.settings?.pxPerLevel || AppState.defaultSettings.pxPerLevel,
  );
  let referenceTime = $derived(options.referenceTime ?? 0);
  const offsetX =
    options.offsetX ?? ((timestamp: number) => (timestamp / 1000.0) * pxPerSec);

  const getLevel = $derived.by(() => {
    const numIcons = icons.length;
    const res: number[] = Array(numIcons).fill(-1);
    const occupied: number[] = [];
    for (let i = 0; i < numIcons; i++) {
      if (res[i] >= 0) continue;
      let j = 0;
      for (j = 0; j < occupied.length; j++) {
        if (
          ((icons[i].timestamp - occupied[j]) / 1000.0) * pxPerSec >
          horizontalOverlap
        ) {
          break;
        }
      }
      res[i] = j;
      if (j == occupied.length) {
        occupied.push(icons[i].timestamp);
      } else {
        occupied[j] = icons[i].timestamp;
      }

      if (options.mergeGroups) {
        const k = options.mergeGroups.findIndex(
          ({ firstEventIdx: idx }) => idx === i,
        );
        if (k >= 0) {
          options.mergeGroups[k].mergedIdxs.forEach((idx) => {
            res[idx] = j;
            occupied[j] = Math.max(occupied[j], icons[idx].timestamp);
          });
        }
      }
    }
    return res;
  });
  const heightInLevel = $derived(Math.max(0, ...getLevel));

  function setCursor(timestamp: number) {
    cursor = offsetX(timestamp);
  }

  function toggleIcon(event: MouseEvent, icon: Icon<T>) {
    if (!options.onToggle) return;
    event.preventDefault();
    options.onToggle(icon);
  }

  function toggleIconWithKeyboard(event: KeyboardEvent, icon: Icon<T>) {
    if (!options.onToggle) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    options.onToggle(icon);
  }

  const offsetYdata = $derived(getLevel);

  function getBoundaryClasses(emphasisLevel: number, isSelected: boolean) {
    if (datatype === 'text') {
      return '';
    }
    if (isSelected && emphasisLevel === 99) {
      return 'z-1 outline outline-2 outline-offset-1 outline-yellow-300 shadow-[inset_0_0_0_6px_rgba(255,0,0,1)]';
    } else if (isSelected) {
      return 'z-1 outline outline-2 outline-offset-1 outline-yellow-300 shadow-[inset_0_0_0_2px_rgb(255,255,255,0.9)]';
    } else if (emphasisLevel === 99) {
      return 'z-1 shadow-[inset_0_0_0_6px_rgba(255,0,0,1)]';
    } else {
      return 'hover:z-1 hover:shadow-[inset_0_0_0_2px_rgb(255,255,255,0.6)]';
    }
  }
</script>

<div
  class="relative"
  style:height="calc(1.5rem + {heightInLevel * pxPerLevel}px)"
>
  {#each icons as icon, i (i)}
    {@const timestamp = icon.timestamp}
    {@const isSelected = options.isSelected?.(icon) ?? false}
    {@const boundaryClasses = getBoundaryClasses(
      icon.emphasisLevel ?? 0,
      isSelected,
    )}
    <!-- Overkill in the damage-taken timeline: red boundary -->
    <div
      class="absolute inline-block p-[2px] ${boundaryClasses}"
      style:left="{offsetX(timestamp)}px"
      style:top="{offsetYdata[i] * pxPerLevel}px"
      role="button"
      tabindex="0"
      onmouseover={() => setCursor(timestamp)}
      onfocus={() => setCursor(timestamp)}
      onmouseleave={() => (cursor = null)}
      onblur={() => (cursor = null)}
      onclick={(event) => toggleIcon(event, icon)}
      onkeydown={(event) => toggleIconWithKeyboard(event, icon)}
    >
      {#if detailsRenderer}
        <WithTooltip placement="bottom" classes="flex leading-none">
          {#snippet tooltip()}
            {@render detailsRenderer(icon, referenceTime)}
          {/snippet}
          {@render contentRenderer(icon)}
        </WithTooltip>
      {:else}
        {@render contentRenderer(icon)}
      {/if}
    </div>
  {/each}
</div>
