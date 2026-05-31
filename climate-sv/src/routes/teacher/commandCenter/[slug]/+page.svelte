<script lang="ts">
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import {
		createSession,
		getTeacherSessions,
		deleteSession
	} from '$lib/services/realtimeDB.service';
	import type { SessionData } from '$lib/stores/game.store';
	import { authUser } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import ButtonGroup from '$lib/components/ButtonGroup.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import LoadingBar from '$lib/components/LoadingBar.svelte';
	import Gamepad from '@lucide/svelte/icons/gamepad';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Wifi from '@lucide/svelte/icons/wifi';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Settings from '@lucide/svelte/icons/settings';
	import RetroInput from '$lib/components/RetroInput.svelte';
	import { getUserDefaults, getTeacherScenarios } from '$lib/services/firestore.service';
	import { GAME_DATA } from '$lib/data/gameData';
	import { teacherLogOut } from '$lib/services/auth.service';
	import { onMount } from 'svelte';
	import { emitError } from '$lib/stores/snackbar.store';
	import { page } from '$app/state';
	import { loading } from '$lib/stores/game.store';

	const teacherUid = $derived(page.params.slug);
	let sessions = $state<SessionData[]>([]);

	let sessionConfig = $state({ maxRounds: 5, timerSeconds: 90, maxResources: 100 });
	let customScenarios = $state<any[]>([]);

	onMount(async () => {
		if ($authUser) {
			loading.set(true);
			try {
				sessions = await getTeacherSessions($authUser.uid);
				const defaults = await getUserDefaults($authUser.uid);
				sessionConfig = { ...defaults };
				customScenarios = await getTeacherScenarios($authUser.uid);
			} catch {
				emitError('Failed to load sessions.');
			} finally {
				loading.set(false);
			}
		} else {
			goto('/teacher/commandCenter');
		}
	});

	async function newSession() {
		if (!$authUser) return;
		loading.set(true);
		try {
			const gameDataOverride = {
				...GAME_DATA,
				config: {
					maxRounds: sessionConfig.maxRounds,
					timerSeconds: sessionConfig.timerSeconds,
					maxResources: sessionConfig.maxResources
				},
				scenarios: [
					...GAME_DATA.scenarios.filter((s) => !sessionConfig.hiddenScenarios?.includes(s.id)),
					...customScenarios
				]
			};

			const code = await createSession($authUser.uid, gameDataOverride as any);
			goto(`/teacher/commandCenter/${$authUser.uid}/${code}`);
		} catch (error) {
			emitError('Failed to create session');
		} finally {
			loading.set(false);
		}
	}

	function handleReconnect(code: string) {
		if (!$authUser) return;
		goto(`/teacher/commandCenter/${$authUser.uid}/${code}`);
	}

	async function handleDelete(code: string) {
		if (!$authUser) return;
		try {
			await deleteSession($authUser.uid, code);
			sessions = sessions.filter((s) => s.code !== code);
		} catch (error) {
			emitError('Failed to delete session');
		}
	}

	async function logout() {
		try {
			await teacherLogOut();
			goto('/');
		} catch (error) {
			emitError('Logout failed');
		}
	}
</script>

<div class="teacher-main-screen">
	<GlitchyTitle>Command Center</GlitchyTitle>

	<ButtonGroup>
		<RetroButton danger onclick={logout}><LogOut /> LogOut</RetroButton>
		<RetroButton secondary onclick={() => goto(`/teacher/commandCenter/${teacherUid}/config`)}>
			<Settings /> Config
		</RetroButton>
	</ButtonGroup>

	<section class="session-setup">
		<h2>New Mission Setup</h2>
		<div class="setup-grid">
			<RetroInput type="number" label="Time (s)" bind:value={sessionConfig.timerSeconds} />
			<RetroInput type="number" label="Rounds" bind:value={sessionConfig.maxRounds} />
			<RetroInput type="number" label="Resources" bind:value={sessionConfig.maxResources} />
		</div>
		<RetroButton onclick={newSession} disabled={$loading}><Gamepad /> Start New Mission</RetroButton
		>
	</section>

	{#if $loading}
		<LoadingBar message="Syncing with satellite..." />
	{/if}

	{#if sessions.length > 0}
		<section class="sessions-section">
			<h2>Active Sessions</h2>
			<p>Continue an ongoing mission or manage your sessions.</p>
			<div class="sessions-list">
				{#each sessions as session}
					<SessionCard
						code={session.code}
						playerCount={session.players ? Object.keys(session.players).length : 0}
						createdAt={session.createdAt}
					>
						{#snippet actions()}
							<RetroButton mini onclick={() => handleReconnect(session.code)}>
								<Wifi /> Reconnect
							</RetroButton>
							<RetroButton mini danger onclick={() => handleDelete(session.code)}>
								<Trash2 />
							</RetroButton>
						{/snippet}
					</SessionCard>
				{/each}
			</div>
		</section>
	{:else if !$loading}
		<p class="empty-msg">No active sessions found.</p>
	{/if}
</div>

<style>
	.teacher-main-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 4rem 2rem;
		max-width: 1440px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.teacher-main-screen {
			padding: 2rem 1rem;
		}
	}
	.session-setup {
		width: 100%;
		max-width: 700px;
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid var(--muted-teal);
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}
	.session-setup h2 {
		font-family: var(--font-head);
		color: var(--teal);
		margin: 0;
	}
	.setup-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		width: 100%;
	}
	@media (max-width: 600px) {
		.setup-grid {
			grid-template-columns: 1fr;
		}
	}
	.sessions-section {
		width: 100%;
		max-width: 700px;
	}
	.sessions-section h2 {
		font-family: var(--font-head);
		margin-bottom: 0.5rem;
	}
	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
		max-height: 400px;
		overflow-y: auto;
		padding-right: 10px;
		scrollbar-width: thin;
		scrollbar-color: var(--teal) transparent;
	}
	.sessions-list::-webkit-scrollbar {
		width: 6px;
	}
	.sessions-list::-webkit-scrollbar-thumb {
		background: var(--teal);
		border-radius: 3px;
	}
	.empty-msg {
		opacity: 0.5;
		font-style: italic;
	}
</style>
