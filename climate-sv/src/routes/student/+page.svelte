<script lang="ts">
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import RetroInput from '$lib/components/RetroInput.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import ButtonGroup from '$lib/components/ButtonGroup.svelte';
	import LoadingBar from '$lib/components/LoadingBar.svelte';
	import UndoDot from '@lucide/svelte/icons/undo-dot';
	import LogIn from '@lucide/svelte/icons/log-in';
	import { goto } from '$app/navigation';
	import { emitError } from '$lib/stores/snackbar.store';
	import { uid, sessionCode, hostUid, loading } from '$lib/stores/game.store';
	import { resolveSessionHost, joinSession } from '$lib/services/realtimeDB.service';
	import { signInAnonymously } from 'firebase/auth';
	import { auth } from '../../firebase/config';

	let codeValue = $state('');
	let nameValue = $state('');

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (codeValue.length !== 4) {
			emitError('Enter a 4-digit mission code.');
			return;
		}
		if (nameValue.length < 2) {
			emitError('Enter a name with at least 2 characters.');
			return;
		}

		loading.set(true);

		try {
			// 1. Resolve the host teacher for this code
			const host = await resolveSessionHost(codeValue);
			if (!host) {
				emitError('Session not found. Check the mission code.');
				loading.set(false);
				return;
			}

			// 2. Authenticate anonymously
			let user = auth.currentUser;
			if (!user) {
				const cred = await signInAnonymously(auth);
				user = cred.user;
			}

			// 3. Join the session
			await joinSession(host, codeValue, user.uid, nameValue);

			// 4. Persist state and navigate
			uid.set(user.uid);
			sessionCode.set(codeValue);
			hostUid.set(host);

			// Store for reconnection
			const storage = window.location.hostname === 'localhost' ? sessionStorage : localStorage;
			storage.setItem('climateCivSessionCode', codeValue);
			storage.setItem('climateCivHostUid', host);

			goto('/student/lobby');
		} catch (e: any) {
			emitError(e.message || 'Failed to join session.');
		} finally {
			loading.set(false);
		}
	}
</script>

<div class="student-join-page">
	<GlitchyTitle>Join Mission</GlitchyTitle>

	<form onsubmit={handleSubmit}>
		<RetroInput
			bind:value={codeValue}
			label="MISSION CODE"
			name="join-code"
			type="text"
			placeholder="0000"
			maxlength={4}
			aria-label="Session Code"
			required
		/>
		<RetroInput
			bind:value={nameValue}
			label="LEADER NAME"
			name="player-name"
			type="text"
			placeholder="My Name"
			maxlength={12}
			aria-label="Player Name"
			required
		/>

		{#if $loading}
			<LoadingBar message="Connecting to satellite..." />
		{/if}

		<ButtonGroup>
			<RetroButton secondary btnLink href="/">
				<UndoDot /> Back
			</RetroButton>
			<RetroButton type="submit" disabled={$loading}>
				<LogIn /> Connect
			</RetroButton>
		</ButtonGroup>
	</form>
</div>

<style>
	.student-join-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 4rem 2rem;
		max-width: 1440px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.student-join-page {
			padding: 2rem 1rem;
		}
	}
	form {
		width: 100%;
		max-width: 500px;
		margin: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
