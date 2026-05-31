<script lang="ts">
	import { base } from '$app/paths';
	import GlitchyTitle from '$lib/components/GlitchyTitle.svelte';
	import RetroInput from '$lib/components/RetroInput.svelte';
	import RetroButton from '$lib/components/RetroButton.svelte';
	import ButtonGroup from '$lib/components/ButtonGroup.svelte';
	import { teacherLogin } from '$lib/services/auth.service';
	import { authUser, authLoading } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { CLOSE_SNACKBAR, snackbar } from '$lib/stores/snackbar.store';
	import UndoDot from '@lucide/svelte/icons/undo-dot';
	import Send from '@lucide/svelte/icons/send';

	let emailValue = $state('');
	let passwordValue = $state('');

	$effect(() => {
		if (!$authLoading && $authUser && !$authUser.isAnonymous) {
			goto(`${base}/teacher/commandCenter/${$authUser.uid}`);
		}
	});

	function handleSubmit(event: Event) {
		event.preventDefault();
		teacherLogin(emailValue, passwordValue)
			.then((userCredential) => {
				// Login bem-sucedido
				const user = userCredential.user;
				console.log('Login bem-sucedido:', user);
				// Atualiza o estado global do usuário autenticado
				authUser.set(user);
				// Redireciona para a página do Command Center
				goto(`${base}/teacher/commandCenter/${user.uid}`);
			})
			.catch((error) => {
				// Tratar erros de login
				const errorCode = error.code;
				const errorMessage = error.message;
				console.error('Erro de login:', errorCode, errorMessage);
				// Exibir mensagem de erro para o usuário ou realizar outras ações necessárias
				snackbar.set({
					message: 'Login failed. Please check your credentials and try again.',
					duration: 5000,
					actions: [{ label: 'Close', callback: CLOSE_SNACKBAR }],
					position: 'center'
				});
			});
	}
</script>

<div class="teacher-login-screen">
	<GlitchyTitle>Command Center</GlitchyTitle>
	<div class="warning-ticker">
		<span class="warning-sign">!! RESTRICTED ACCESS !!</span>
	</div>
	<form onsubmit={handleSubmit}>
		<RetroInput
			bind:value={emailValue}
			label="EMAIL"
			name="teacher-email"
			type="email"
			placeholder="your@email.com"
			aria-label="Teacher's E-mail"
			required
		/>
		<RetroInput
			bind:value={passwordValue}
			label="PASSWORD"
			name="teacher-password"
			type="password"
			placeholder="••••••••"
			aria-label="Teacher's Password"
			required
		/>
		<ButtonGroup>
			<RetroButton secondary btnLink href="{base}/"><UndoDot /> Back</RetroButton>
			<RetroButton type="submit"><Send/> Submit</RetroButton>
		</ButtonGroup>
	</form>
</div>

<style>
	.teacher-login-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 4rem 2rem;
		max-width: 1440px;
		margin: 0 auto;
	}
	@media (max-width: 600px) {
		.teacher-login-screen {
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
	.warning-ticker {
		background: #000;
		border-top: 2px solid var(--error-color);
		border-bottom: 2px solid var(--error-color);
		padding: 10px;
		max-width: 60%;
		margin: 1rem auto;
		overflow: hidden;
		position: relative;
	}

	.warning-sign {
		display: block;
		color: var(--error-color);
		font-family: var(--font-head);
		font-weight: 900;
		font-size: 1.2rem;
		text-align: center;
		letter-spacing: 5px;
		text-shadow: 0 0 10px var(--error-color);
		animation: blink 0.8s infinite;
	}
</style>
