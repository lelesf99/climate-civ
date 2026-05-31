<script lang="ts">
	let { children, level = 1, animate = true, sub = false, ...rest } = $props();
	const tag = $derived(`h${level}`);
</script>

<svelte:element this={tag} {...rest} class:animate class:sub>
	{@render children()}
</svelte:element>

<style>
	@keyframes glitch {
		0% {
			text-shadow:
				2px 2px 1px var(--orange),
				-2px -2px 1px var(--teal),
				0 0 5px var(--teal);
		}
		97% {
			text-shadow:
				2px 2px 1px var(--orange),
				-4px -4px 1px var(--teal),
				0 0 5px var(--teal);
		}
		98% {
			text-shadow:
				4px 4px 10px var(--orange),
				-2px -2px 10px var(--teal),
				0 0 5px var(--teal);
		}
		99% {
			text-shadow:
				-2px -2px 1px var(--orange),
				2px 2px 1px var(--teal),
				0 0 5px var(--teal);
		}
		100% {
			text-shadow:
				2px 2px 1px var(--orange),
				-2px -2px 1px var(--teal),
				0 0 5px var(--teal);
		}
	}
	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		position: relative;
		display: inline-block;
		color: var(--text-color);
		text-shadow: var(--chromatic-text);
	}
	h1 {
		font-size: 5rem;
	}
	h2 {
		font-size: 4rem;
	}
	h3 {
		font-size: 3rem;
	}
	h4 {
		font-size: 2rem;
	}
	h5 {
		font-size: 1.5rem;
	}
	h6 {
		font-size: 1rem;
	}
	*.animate {
		animation: glitch 2s infinite alternate step-end;
	}
	*.animate:nth-child(2n) {
		animation-delay: 1.333s;
	}
	*.animate:nth-child(2n + 1) {
		animation-delay:  2.6666s;
	}
	*.sub {
		font-size: large;
		color: var(--white);
		text-shadow: 0 0 10px var(--teal) !important;
	}
    h1.sub {
        font-size: 2.5rem;
    }
    h2.sub {
        font-size: 2rem;
    }
    h3.sub {
        font-size: 1.5rem;
    }
    h4.sub {
        font-size: 1.2rem;
    }
    h5.sub {
        font-size: 1rem;
    }
    h6.sub {
        font-size: 0.8rem;
    }

</style>
