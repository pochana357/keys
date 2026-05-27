<script lang="ts">
  import type { Ability } from '$lib/api/wclTypes';

  let {
    ability,
    classes = '',
  }: {
    ability: Ability;
    classes?: string;
  } = $props();
</script>

<a
  href="https://www.wowhead.com/spell={ability.guid}"
  target="_blank"
  rel="noreferrer"
>
  <img
    class="w-5 max-w-none {classes}"
    src="https://assets.rpglogs.com/img/warcraft/abilities/{ability.abilityIcon}"
    alt={ability.name}
  />
</a>
