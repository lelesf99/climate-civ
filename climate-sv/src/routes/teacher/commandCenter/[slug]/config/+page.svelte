<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		getUserDefaults,
		saveUserDefaults,
		getTeacherScenarios,
		saveTeacherScenario,
		deleteTeacherScenario,
		type UserDefaults
	} from '$lib/services/firestore.service';
	import type { Scenario } from '$lib/data/gameData';
	import { GAME_DATA } from '$lib/data/gameData';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import RetroInput from '$lib/components/RetroInput.svelte';
	import RetroTextArea from '$lib/components/RetroTextArea.svelte';
	import RetroSelect from '$lib/components/RetroSelect.svelte';
	import TerminalAnimation from '$lib/components/TerminalAnimation.svelte';
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import { emitNotification, emitError } from '$lib/stores/snackbar.store';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import Save from '@lucide/svelte/icons/save';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const teacherUid = $derived(page.params.slug!);
	let activeTab = $state<'defaults' | 'scenarios'>('defaults');
	let isSaving = $state(false);

	let defaults = $state<UserDefaults>({ maxRounds: 5, timerSeconds: 90, maxResources: 100 });
	let scenarios = $state<Scenario[]>([]);
	let allScenarios = $derived([
		...GAME_DATA.scenarios.filter((s) => !defaults.hiddenScenarios?.includes(s.id)),
		...scenarios
	]);

	let editingScenario = $state<Scenario | null>(null);
	let editingScenarioOriginalId = $state<string | null>(null);

	const categoryOptions = [
		{ label: 'Early Game', value: 'early-game' },
		{ label: 'Mid Game (Present)', value: 'mid-game-present' },
		{ label: 'Mid Game (Future)', value: 'mid-game-future' },
		{ label: 'Endgame', value: 'endgame' }
	];

	const typeOptions = [
		{ label: 'Neutral', value: 'neutral' },
		{ label: 'Good', value: 'good' },
		{ label: 'Bad', value: 'bad' },
		{ label: 'Utopia', value: 'utopia' },
		{ label: 'Stability', value: 'stability' },
		{ label: 'Collapse', value: 'collapse' }
	];

	onMount(async () => {
		try {
			defaults = await getUserDefaults(teacherUid);
			scenarios = await getTeacherScenarios(teacherUid);
		} catch (error) {
			emitError('Error loading configurations.');
		}
	});

	async function handleSaveDefaults() {
		isSaving = true;
		try {
			await saveUserDefaults(teacherUid, defaults);
			emitNotification('Global settings saved!');
		} catch (e: any) {
			emitError('Failed to save settings.');
		} finally {
			isSaving = false;
		}
	}

	function handleAddScenario() {
		editingScenario = {
			id: `custom-${Date.now()}`,
			category: 'early-game',
			type: 'neutral',
			text: 'New Scenario Description',
			initiatives: [
				{ id: 'init-1', name: 'Initiative 1', ideal: 50 },
				{ id: 'init-2', name: 'Initiative 2', ideal: 50 }
			]
		};
		editingScenarioOriginalId = null;
	}

	function selectScenario(scenario: Scenario) {
		editingScenario = JSON.parse(JSON.stringify(scenario));
		editingScenarioOriginalId = scenario.id;
	}

	function addInitiative() {
		if (!editingScenario) return;
		if (editingScenario.initiatives.length >= 10) return;

		editingScenario.initiatives.push({
			id: `init-${Date.now()}`,
			name: 'New Initiative',
			ideal: 50
		});
	}

	function removeInitiative(idx: number) {
		if (!editingScenario) return;
		if (editingScenario.initiatives.length <= 2) return;
		editingScenario.initiatives.splice(idx, 1);
	}

	async function handleSaveScenario() {
		if (!editingScenario) return;

		if (editingScenario.initiatives.length < 2 || editingScenario.initiatives.length > 10) {
			emitError('A scenario must have between 2 and 10 initiatives.');
			return;
		}

		editingScenario.id = (editingScenario.id || `custom-${Date.now()}`)
			.trim()
			.replace(/[^a-zA-Z0-9_-]/g, '-')
			.toLowerCase();

		isSaving = true;
		try {
			const isDefault = GAME_DATA.scenarios.some((s) => s.id === editingScenarioOriginalId);
			if (isDefault) {
				const originalId = editingScenarioOriginalId!;
				if (editingScenario.id === originalId) {
					editingScenario.id = `custom-${Date.now()}`;
				}

				defaults.hiddenScenarios = [...(defaults.hiddenScenarios || []), originalId];
				await saveUserDefaults(teacherUid, defaults);

				await saveTeacherScenario(teacherUid, editingScenario);
				scenarios = [...scenarios, editingScenario];
			} else {
				if (editingScenarioOriginalId && editingScenarioOriginalId !== editingScenario.id) {
					await deleteTeacherScenario(editingScenarioOriginalId);
					scenarios = scenarios.filter((s) => s.id !== editingScenarioOriginalId);
				}

				await saveTeacherScenario(teacherUid, editingScenario);
				const idx = scenarios.findIndex((s) => s.id === editingScenario.id);
				if (idx !== -1) {
					scenarios[idx] = editingScenario;
				} else {
					scenarios = [...scenarios, editingScenario];
				}
			}
			editingScenarioOriginalId = editingScenario.id;
			emitNotification('Scenario saved successfully!');
		} catch (e: any) {
			emitError('Failed to save scenario.');
		} finally {
			isSaving = false;
		}
	}

	async function handleDeleteScenario() {
		if (!editingScenario) return;

		isSaving = true;
		try {
			const isDefault = GAME_DATA.scenarios.some((s) => s.id === editingScenarioOriginalId);
			if (isDefault) {
				defaults.hiddenScenarios = [...(defaults.hiddenScenarios || []), editingScenarioOriginalId!];
				await saveUserDefaults(teacherUid, defaults);
			} else {
				if (editingScenarioOriginalId) {
					await deleteTeacherScenario(editingScenarioOriginalId);
				}
				scenarios = scenarios.filter((s) => s.id !== editingScenarioOriginalId);
			}
			editingScenario = null;
			editingScenarioOriginalId = null;
			emitNotification('Scenario deleted.');
		} catch (e: any) {
			emitError('Failed to delete scenario.');
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Game Configuration - Climate Civ</title>
</svelte:head>

<div class="config-layout">
	<header class="config-header">
		<RetroButton mini onclick={() => goto(`/teacher/commandCenter/${teacherUid}`)}>
			<ArrowLeft /> Back
		</RetroButton>
		<GlitchyTitle>SYSTEM CONFIGURATION</GlitchyTitle>
	</header>

	<div class="tabs">
		<button
			class="tab-btn"
			class:active={activeTab === 'defaults'}
			onclick={() => (activeTab = 'defaults')}
		>
			Global Defaults
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'scenarios'}
			onclick={() => (activeTab = 'scenarios')}
		>
			Scenario Editor
		</button>
	</div>

	<main class="config-content">
		{#if activeTab === 'defaults'}
			<section class="panel fade-in">
				<h2>Mission Default Parameters</h2>
				<p class="desc">These settings will be loaded as defaults when you create a new session.</p>

				<div class="form-grid">
					<RetroInput
						type="number"
						label="Timer per Round (s)"
						bind:value={defaults.timerSeconds}
					/>
					<RetroInput type="number" label="Max Rounds" bind:value={defaults.maxRounds} />
					<RetroInput type="number" label="Max Resources" bind:value={defaults.maxResources} />
				</div>

				<div class="actions">
					<RetroButton onclick={handleSaveDefaults} disabled={isSaving}>
						<Save /> Save Global Settings
					</RetroButton>
				</div>
			</section>
		{:else if activeTab === 'scenarios'}
			<div class="scenarios-layout fade-in">
				<aside class="scenarios-sidebar">
					<div class="sidebar-header">
						<h3>Scenarios</h3>
						<button class="icon-btn" onclick={handleAddScenario} title="Add Scenario"
							><Plus size={20} /></button
						>
					</div>
					<ul class="scenario-list">
						{#each allScenarios as scenario, idx}
							<li>
								<button
									class="scenario-item"
									class:selected={editingScenario?.id === scenario.id}
									onclick={() => selectScenario(scenario)}
								>
									<span class="s-id">{scenario.id}</span>
									<span class="badge">{scenario.category}</span>
								</button>
							</li>
						{:else}
							<p class="empty">No custom scenarios found.</p>
						{/each}
					</ul>
				</aside>

				<section class="scenario-editor">
					{#if editingScenario}
						<div class="editor-header">
							<h2>Edit Scenario</h2>
							<button class="icon-btn danger" onclick={handleDeleteScenario} title="Delete"
								><Trash2 size={20} /></button
							>
						</div>

						<div class="form-group">
							<RetroInput
								label="Scenario ID"
								bind:value={editingScenario.id}
							/>
						</div>

						<div class="form-row">
							<RetroSelect
								label="Category"
								options={categoryOptions}
								bind:value={editingScenario.category}
							/>
							<RetroSelect
								label="Type / Branch"
								options={typeOptions}
								bind:value={editingScenario.type}
							/>
						</div>

						<div class="form-group">
							<RetroTextArea
								label="Story / Description"
								rows={3}
								bind:value={editingScenario.text}
							/>
						</div>

						<!-- INITIATIVES -->
						<div class="section-divider">
							<h3>Initiatives ({editingScenario.initiatives.length}/10)</h3>
							{#each editingScenario.initiatives as init, idx}
								<div class="initiative-row">
									<RetroInput label="Name" bind:value={init.name} />
									<RetroInput type="number" label="Ideal %" bind:value={init.ideal} />
									<button
										class="icon-btn danger"
										onclick={() => removeInitiative(idx)}
										disabled={editingScenario.initiatives.length <= 2}
									>
										<Trash2 size={18} />
									</button>
								</div>
							{/each}
							<div class="init-actions">
								<RetroButton
									mini
									onclick={addInitiative}
									disabled={editingScenario.initiatives.length >= 10}
								>
									<Plus /> Add Initiative
								</RetroButton>
							</div>
						</div>

						<!-- NEWS TEMPLATES -->
						<div class="section-divider">
							<h3>News Templates (Optional)</h3>
							<p class="desc">
								Each line is a different news template. Use {'{continent}'} for dynamic insertion.
							</p>
							<div class="form-group">
								<label for="good-news">Good Outcome</label>
								<textarea
									class="raw-textarea"
									id="good-news"
									rows="2"
									value={editingScenario.news?.good?.join('\n') || ''}
									oninput={(e) => {
										const val = (e.target as HTMLTextAreaElement).value;
										if (!editingScenario!.news)
											editingScenario!.news = { good: [], bad: [], neutral: [] };
										editingScenario!.news!.good = val.split('\n').filter((s) => s.trim());
									}}
								></textarea>
							</div>
							<div class="form-group">
								<label for="bad-news">Bad Outcome</label>
								<textarea
									class="raw-textarea"
									id="bad-news"
									rows="2"
									value={editingScenario.news?.bad?.join('\n') || ''}
									oninput={(e) => {
										const val = (e.target as HTMLTextAreaElement).value;
										if (!editingScenario!.news)
											editingScenario!.news = { good: [], bad: [], neutral: [] };
										editingScenario!.news!.bad = val.split('\n').filter((s) => s.trim());
									}}
								></textarea>
							</div>
							<div class="form-group">
								<label for="neutral-news">Neutral Outcome</label>
								<textarea
									class="raw-textarea"
									id="neutral-news"
									rows="2"
									value={editingScenario.news?.neutral?.join('\n') || ''}
									oninput={(e) => {
										const val = (e.target as HTMLTextAreaElement).value;
										if (!editingScenario!.news)
											editingScenario!.news = { good: [], bad: [], neutral: [] };
										editingScenario!.news!.neutral = val.split('\n').filter((s) => s.trim());
									}}
								></textarea>
							</div>
						</div>

						<div class="actions">
							<RetroButton onclick={handleSaveScenario} disabled={isSaving}
								><Save /> Save Scenario</RetroButton
							>
						</div>
					{:else}
						<div class="empty-state">
							<TerminalAnimation />
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</main>
</div>

<style>
	.config-layout {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		display: grid;
		grid-template-areas:
			'header'
			'tabs'
			'content';
		grid-template-rows: auto auto 1fr;
		gap: 2rem;
		height: 100vh;
		box-sizing: border-box;
	}
	.config-header {
		grid-area: header;
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.tabs {
		grid-area: tabs;
		display: flex;
		gap: 1rem;
		border-bottom: 2px solid var(--muted-teal);
		padding-bottom: 0.5rem;
	}
	.tab-btn {
		background: transparent;
		border: none;
		color: var(--text-color);
		font-family: var(--font-head);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.5rem 1rem;
		opacity: 0.6;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 2px;
	}
	.tab-btn:hover {
		opacity: 1;
		color: var(--teal);
	}
	.tab-btn.active {
		opacity: 1;
		color: var(--orange);
		border-bottom: 3px solid var(--orange);
		margin-bottom: -0.7rem;
	}

	.config-content {
		grid-area: content;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
	}
	.panel {
		background: rgba(15, 23, 42, 0.6);
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid var(--muted-teal);
		max-width: 800px;
		margin: 0 auto;
	}
	.panel h2 {
		color: var(--teal);
		font-family: var(--font-head);
		letter-spacing: 2px;
		margin-bottom: 0.5rem;
	}
	.desc {
		color: var(--text-color);
		opacity: 0.7;
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	.form-group {
		margin-bottom: 1.5rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	/* SCENARIOS LAYOUT */
	.scenarios-layout {
		display: grid;
		grid-template-areas: 'sidebar editor';
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	.scenarios-sidebar {
		grid-area: sidebar;
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid var(--muted-teal);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}
	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--muted-teal);
	}
	.sidebar-header h3 {
		color: var(--teal);
		font-family: var(--font-head);
		margin: 0;
	}
	.scenario-list {
		list-style: none;
		padding: 0;
		margin: 0;
		flex: 1;
		overflow-y: auto;
	}
	.scenario-item {
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(32, 211, 238, 0.1);
		padding: 1rem;
		color: var(--text-color);
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		transition: all 0.2s;
	}
	.scenario-item:hover {
		background: rgba(32, 211, 238, 0.1);
	}
	.scenario-item.selected {
		background: rgba(249, 115, 22, 0.1);
		border-left: 4px solid var(--orange);
	}
	.s-id {
		font-family: var(--font-code);
		font-weight: bold;
		font-size: 1.1rem;
	}
	.badge {
		background: var(--teal);
		color: #000;
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		width: max-content;
		font-weight: bold;
		text-transform: uppercase;
	}

	.scenario-editor {
		grid-area: editor;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid var(--muted-teal);
		border-radius: 8px;
		padding: 2rem;
		height: 100%;
		overflow-y: auto;
	}
	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--muted-teal);
		padding-bottom: 1rem;
	}
	.editor-header h2 {
		color: var(--orange);
		font-family: var(--font-head);
		letter-spacing: 2px;
		margin: 0;
	}

	.section-divider {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px dashed var(--muted-teal);
	}
	.section-divider h3 {
		color: var(--teal);
		font-family: var(--font-head);
		margin-bottom: 0.5rem;
	}

	.initiative-row {
		display: grid;
		grid-template-columns: 1fr 100px 40px;
		gap: 1rem;
		align-items: end;
		margin-bottom: 1rem;
		background: rgba(0, 0, 0, 0.2);
		padding: 1rem;
		border-radius: 6px;
	}
	.init-actions {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.icon-btn {
		background: transparent;
		border: 1px solid var(--teal);
		color: var(--teal);
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	.icon-btn:hover {
		background: var(--teal);
		color: #000;
	}
	.icon-btn.danger {
		border-color: var(--error-color);
		color: var(--error-color);
	}
	.icon-btn.danger:hover {
		background: var(--error-color);
		color: #000;
	}

	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 300px;
	}
	.fade-in {
		animation: fadeIn 0.3s ease-out;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.raw-textarea {
		width: 100%;
		background: var(--muted-blue);
		border: 2px solid var(--blue);
		padding: 0.8rem;
		color: var(--text-color);
		font-family: var(--font-code);
		border-radius: 6px;
		box-sizing: border-box;
		resize: vertical;
	}
	.raw-textarea:focus {
		outline: none;
		border-color: var(--orange);
	}
	label {
		color: var(--teal);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		display: block;
		margin-bottom: 0.5rem;
		font-family: var(--font-code);
	}
</style>
