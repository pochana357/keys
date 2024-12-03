<script lang="ts">
	import poochyenasWalking from '$lib/assets/poochyenas_walking.mp4';
	import poochyenaAwaken from '$lib/assets/poochyena_awaken.mp4';
	import poochyenaShadowball from '$lib/assets/poochyena_shadowball.mp4';

	import poochyenaBite from '$lib/assets/poochyena_bite.gif';
	import poochyenaGrowl from '$lib/assets/poochyena_growl.gif';
	import poochyenaThreaten from '$lib/assets/poochyena_threaten.gif';
	import poochyenaYawn from '$lib/assets/poochyena_yawn.gif';
	import { onMount } from 'svelte';
	const videos = [poochyenasWalking, poochyenaAwaken, poochyenaShadowball];
	const gifs = [poochyenaBite, poochyenaGrowl, poochyenaThreaten, poochyenaYawn];
	function randomPoochyenaVideo() {
		return videos[Math.floor(Math.random() * videos.length)];
	}
	function randomPoochyenaGif() {
		return gifs[Math.floor(Math.random() * gifs.length)];
	}
	function randomPoochyena() {
		const r = Math.floor(Math.random() * (videos.length + gifs.length));
		if (r < videos.length) {
			return { mediaType: 'video', src: videos[r] };
		} else {
			return { mediaType: 'gif', src: gifs[r - videos.length] };
		}
	}

	let { current, total }: { current: number; total: number } = $props();
	let media = $state(randomPoochyena());
	onMount(() => {
		media = randomPoochyena();
	});
</script>

<div
	class="absolute left-0 top-0 z-30 flex h-full w-full flex-col items-center justify-center gap-2 text-lg font-bold"
>
	<!-- svelte-ignore a11y_media_has_caption -->
	{#if media.mediaType == 'gif'}
		<img class="w-80" src={media.src} alt="Poochyena" />
	{:else}
		<video class="w-80" autoplay controlslist="nodownload" loop height="auto">
			<source src={media.src} type="video/mp4" />
		</video>
	{/if}
	<p>Loading... ({current}/{total})</p>
</div>
