<script lang="ts">
	import ButtonGroup from '$lib/components/ButtonGroup.svelte';
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import TutorialCard from '$lib/components/TutorialCard.svelte';
	import UserLock from '@lucide/svelte/icons/user-lock';
	import User from '@lucide/svelte/icons/user';
	import { base } from '$app/paths';


	const tutorialSteps = [
		{
			title: 'The challenge',
			description:
				'You are the leader of a nation in the year 2025. The climate is changing and your mission is to ensure the survival and progress of your civilization until the year 2100.'
		},
		{
			title: 'RESOURCE ALLOCATION',
			description:
				'Each round, you receive 100 credits. Use the sliders to distribute this value among 5 initiatives. Choose wisely where to invest more!'
		},
		{
			title: 'CONSEQUENCES',
			description:
				'Your investments generate a score. Low scores can lead to disasters and criminal crises, while high scores bring stability.'
		},
		{
			title: 'THE VERDICT',
			description:
				'After 5 rounds, we will see the legacy of your governance. Will your civilization reach the Green Utopia or face Total Collapse?'
		}
	];
</script>

<div class="landing-page">
	<GlitchyTitle level={1}>Climate Civilization</GlitchyTitle>
	<GlitchyTitle level={2} sub
		>The climate management simulation for leaders of the future.</GlitchyTitle
	>
	<ButtonGroup>
		<RetroButton secondary btnLink href="{base}/teacher/commandCenter">
			<UserLock />Teacher</RetroButton
		>
		<RetroButton btnLink href="{base}/student"><User />Student</RetroButton>
	</ButtonGroup>
	<section class="tutorial-section">
		<h2>How to Play</h2>
		{#each tutorialSteps as step, index}
			<TutorialCard header={step.title} index={index + 1}>
				<p>{step.description}</p>
			</TutorialCard>
		{/each}
	</section>

	<footer class="main-footer">
		<p>Built with ❤️ by Climate Civ Team</p>
		<p>© 2025 Climate Civilization Simulation</p>
	</footer>
</div>

<style>
	.landing-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding: 4rem 2rem;
		max-width: 1440px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.landing-page {
			padding: 2rem 1rem;
		}
	}
	.tutorial-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.main-footer {
		text-align: center;
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 2px solid var(--teal);
		width: 100%;
		font-size: 0.8rem;
		opacity: 0.6;
	}
	.main-footer p {
		margin: 0.5rem 0;
	}
</style>
