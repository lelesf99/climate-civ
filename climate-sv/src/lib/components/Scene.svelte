<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { CameraControls, useGltf } from '@threlte/extras';
	import { Spring } from 'svelte/motion';

	let { rotationSwitch = false } = $props();
	let rotation = $state({ x: 0, y: 0, z: 0 });
	let rotationOffset = $state({ x: 0, y: 0, z: 0 });

	let controls = $state(undefined);
	let rotationSpring = new Spring({ x: 0, y: 0, z: 0 }, { stiffness: 0.05, damping: .9, precision: 0.00001 });

	const continents = [
		{ name: 'North America', offset: { x: -0.6, y: 4.6, z: 0 } },
		{ name: 'South America', offset: { x: -1.6, y: 4.1, z: 0 } },
		{ name: 'Europe', offset: { x: -0.2, y: 2.95, z: 0 } },
		{ name: 'Africa', offset: { x: -1.3, y: 2.85, z: 0 } },
		{ name: 'Asia', offset: { x: -0.6, y: 1.2, z: 0 } },
		{ name: 'Oceania', offset: { x: -1.65, y: 0.6, z: 0 } }
	];
	useTask((delta) => {
		if (rotationSwitch) return;
		rotation.y += delta * 0.1;
	});
	export function rotateToContinent(continent: string) {
		rotationSwitch = true;
		const found = continents.find((c) => c.name === continent);
		if (found) {
			rotationOffset.x = found.offset.x;
			rotationOffset.y = found.offset.y;
			rotationOffset.z = found.offset.z;
		}
		rotationSpring.target = {
            x: rotation.x + rotationOffset.x,
            y: rotation.y + rotationOffset.y,
            z: rotation.z + rotationOffset.z
        };
	}
</script>

{#await useGltf('/globe.glb') then gltf}
	<T
		is={gltf.scene}
		position={[5, -15, 0]}
		rotation={[
            rotationSpring.current.x,
            rotationSpring.current.y,
            rotationSpring.current.z
        ]}
	/>
{/await}

<T.OrthographicCamera position={[0, 10, 20]} zoom={50} near={0.1} far={400} makeDefault>
	<CameraControls bind:ref={controls} />
</T.OrthographicCamera>
<T.Fog attach="fog" args={['#0f1729', 0, 60]} />
