<script lang="ts">
	// https://floating-ui-svelte.vercel.app/examples/tooltips
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import {
		autoUpdate,
		offset,
		flip,
		shift,
		arrow,
		useFloating,
		FloatingArrow,
		useHover,
		useInteractions,
		useRole,
		useDismiss,
		type Placement
	} from '@skeletonlabs/floating-ui-svelte';

	let {
		tooltip,
		children,
		placement,
		inDelay
	}: {
		tooltip?: string | Snippet<[]>;
		children: Snippet<[]>;
		placement?: Placement;
		inDelay?: boolean;
	} = $props();

	// State
	let open = $state(false);
	let elemArrow: HTMLElement | null = $state(null);

	// Use Floating
	const floating = useFloating({
		whileElementsMounted: autoUpdate,
		get open() {
			return open;
		},
		onOpenChange: (v) => (open = v),
		placement: placement ?? 'top',
		get middleware() {
			return [
				offset(10),
				flip(),
				shift({ padding: 5 }),
				elemArrow && arrow({ element: elemArrow, padding: 8 })
			];
		}
	});

	// Interactions
	const role = useRole(floating.context, { role: 'tooltip' });
	const hover = useHover(floating.context, { move: false });
	const dismiss = useDismiss(floating.context);
	const interactions = useInteractions([role, hover, dismiss]);
</script>

<div>
	<!-- Reference Element -->
	<div bind:this={floating.elements.reference} {...interactions.getReferenceProps()}>
		{@render children()}
	</div>
	<!-- Floating Element -->
	{#if open && tooltip}
		<div
			bind:this={floating.elements.floating}
			style={floating.floatingStyles}
			{...interactions.getFloatingProps()}
			class="floating bg-surface-500 z-10 max-w-sm rounded-sm p-2 text-white shadow-xl"
			in:fade={{ duration: 200, delay: inDelay ? 500 : 0 }}
			out:fade={{ duration: 200 }}
		>
			<!-- .floating not needed in the div above? -->
			{#if typeof tooltip === 'string'}
				{@html tooltip}
			{:else}
				{@render tooltip()}
			{/if}
			<FloatingArrow bind:ref={elemArrow} context={floating.context} fill="#575969" />
		</div>
	{/if}
</div>

<style>
	.floating {
		width: max-content;
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
