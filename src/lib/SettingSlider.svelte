<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';
	import { type Range } from '$lib/AppState';
	type Props = {
		description: string;
		name: string;
		value: number;
		range: Range;
		classes?: string;
	};
	let { description, name, value = $bindable(), range, classes }: Props = $props();

	// The Slider component requires the value wrapped in an array.
	let inputFormValue = $derived([value]);

	const handleValueChange = (details: { value: number[] }) => {
		value = details.value[0];
	};
</script>

<div class="space-y-2 {classes ?? ''}">
	<p>{description}: {value}</p>
	<Slider
		{name}
		min={range.min}
		max={range.max}
		step={1}
		value={inputFormValue}
		onValueChange={handleValueChange}
		height="h-2"
		meterBg="bg-primary-400"
		trackBg="bg-slate-400"
		classes="px-5"
	/>
</div>
