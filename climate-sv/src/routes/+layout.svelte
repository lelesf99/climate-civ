<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Scene from '$lib/components/Scene.svelte';
	import { Canvas } from '@threlte/core';
	import { onMount } from 'svelte';
	import './global.css';
	import Snackbar from '$lib/components/Snackbar.svelte';
	import { setLucideProps } from '@lucide/svelte';
	import { toggleMute, isMuted, playSound } from '$lib/services/audio.service';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeOff from '@lucide/svelte/icons/volume-off';
	import RetroButton from '$lib/components/RetroButton.svelte';

	let { children } = $props();
	
	let sceneRef: any = $state(null);

	import { uid, sessionData } from '$lib/stores/game.store';

	onMount(() => {
		const startAudio = () => {
			playSound('ambiance', 3000);
			window.removeEventListener('click', startAudio);
			window.removeEventListener('keydown', startAudio);
		};
		window.addEventListener('click', startAudio);
		window.addEventListener('keydown', startAudio);
		
		return () => {
			window.removeEventListener('click', startAudio);
			window.removeEventListener('keydown', startAudio);
		};
	});

	$effect(() => {
		if (sceneRef && $uid && $sessionData) {
			const player = $sessionData.players[$uid];
			if (player && player.continent) {
				sceneRef.rotateToContinent(player.continent);
			}
		}
	});

	setLucideProps({
		size: 32,
		strokeWidth: 3
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
<div id="scanline"></div>
<div id="globo" style="pointer-events: none">
	<Canvas>
		<Scene bind:this={sceneRef} />
	</Canvas>
</div>
<Snackbar />
<div id="muteBtn">
	<RetroButton mini onclick={() => toggleMute()}>
		{#if $isMuted}
			<VolumeOff />
		{:else}
			<Volume2 />
		{/if}
	</RetroButton>
</div>
{@render children()}

<style>
	@keyframes flicker {
		0% {
			opacity: 1;
		}
		70% {
			opacity: 0.82;
		}

		100% {
			opacity: 0.95;
		}
	}

	@keyframes scan {
		0% {
			transform: translateY(-100%);
		}

		100% {
			transform: translateY(100%);
		}
	}
	#globo {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -1;
	}
	#scanline {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 10000;
		pointer-events: none;
		background-image: linear-gradient(transparent 50%, rgba(255, 255, 255, 0.05) 50%);
		background-size: 100% 4px;
		animation: flicker 100ms infinite step-end;
	}

	#scanline::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.4) 100%);
		z-index: 10001;
	}

	#scanline::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			0deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.05) 90%,
			rgba(255, 255, 255, 0.1) 100%
		);
		background-attachment: scroll;
		animation: scan 10s linear infinite reverse;
	}
	#muteBtn {
		position: fixed;
		top: 1rem;
		left: 1rem;
		width: 2rem;
		height: 2rem;
	}
</style>
