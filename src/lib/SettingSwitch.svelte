<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import IconX from 'lucide-svelte/icons/x';
	import IconCheck from 'lucide-svelte/icons/check';
	type Props = { description: string; name: string; flag: boolean; classes?: string };
	let { description, name, flag = $bindable(), classes }: Props = $props();
</script>

<div class="flex justify-between pr-4 {classes ?? ''}">
	<p>{description}</p>
	<Switch
		{name}
		checked={flag}
		onCheckedChange={(e) => (flag = e.checked)}
		controlInactive="bg-secondary-100"
	>
		{#snippet inactiveChild()}<IconX size="14" />{/snippet}
		{#snippet activeChild()}<IconCheck size="14" />{/snippet}
	</Switch>
</div>
