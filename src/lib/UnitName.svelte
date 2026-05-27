<script lang="ts">
  import type { UnitRaw } from '$lib/api/wclTypes';
  import ClassUtils from '$lib/utils/ClassUtils';

  let { unit }: { unit: UnitRaw | null } = $props();
</script>

{#if !unit}
  Unknown
{:else if ClassUtils.isPlayer(unit)}
  <span style:color={ClassUtils.classColor(unit.type)} class="font-bold">
    {unit.name}
  </span>
{:else}
  {unit.name}
{/if}
