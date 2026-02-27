import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * GlobeController - Handles 3D Globe rendering using Three.js
 */
export class GlobeController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            precision: 'mediump'
        });
        this.globe = null;
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 150;
        this.camera.position.y = 50;
        this.camera.position.x = -25;

        this.setupLights();
        this.loadGlobe('assets/3d/globe.glb');

        // Responsive
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.setupDebugControls();

        this.animate();
    }

    startCycling(continents, onTransition, intervalMs = 8000) {
        this.stopCycling();
        if (!continents || continents.length === 0) return;

        let currentIndex = 0;

        const next = () => {
            const continent = continents[currentIndex];
            this.focusContinent(continent);
            if (onTransition) onTransition(continent);
            currentIndex = (currentIndex + 1) % continents.length;
        };

        next(); // Start immediately
        this.cycleInterval = setInterval(next, intervalMs);
    }

    stopCycling() {
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval);
            this.cycleInterval = null;
        }
    }

    setupDebugControls() {
        console.log("Globe Debug Controls Active:");
        console.log("- Arrows: Rotate Globe");
        console.log("- Enter: Print Coordinates");

        window.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.key === 'ArrowLeft') {
                this.targetRotation.y -= 0.05;
            }
            if (e.key === 'ArrowRight') {
                this.targetRotation.y += 0.05;
            }
            if (e.key === 'ArrowUp') {
                this.targetRotation.x -= 0.05;
            }
            if (e.key === 'ArrowDown') {
                this.targetRotation.x += 0.05;
            }

            if (e.key === 'Enter') {
                console.log(`CURRENT CALIBRATION:`);
                console.log(`Rotation: { x: ${this.targetRotation.x.toFixed(2)}, y: ${this.targetRotation.y.toFixed(2)} }`);
            }
        });
    }

    // Load Blender Model
    loadGlobe(path) {
        const loader = new GLTFLoader();

        // Handle texture loading errors
        THREE.DefaultLoadingManager.onStart = (url) => console.log('Started loading:', url);
        THREE.DefaultLoadingManager.onError = (url) => console.error('Failed to load resource:', url);

        loader.load(path, (gltf) => {
            if (this.globe) this.scene.remove(this.globe);
            this.globe = gltf.scene;

            // Recenter and scale
            const box = new THREE.Box3().setFromObject(this.globe);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 160 / maxDim; // Adjust based on our 80 radius placeholder
            this.globe.scale.set(scale, scale, scale);

            this.scene.add(this.globe);

            this.focusContinent('AMERICA DO SUL');
            this.startCycling(['AMERICA DO SUL', 'EUROPA', 'AFRICA', 'ASIA', 'OCEANIA']);


            console.log("Custom globe loaded successfully:", path);
        }, undefined, (error) => {
            console.error("Error loading globe model:", error);
        });
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Optional: Add a subtle fill light from the opposite side
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 0, -5);
        this.scene.add(fillLight);

        this.scene.fog = new THREE.Fog(0x476bbd, 100, 200);
        this.scene.fog.color.set(0x476bbd);
        this.scene.fog.density = 0.01;
        this.scene.fog.fogColor = new THREE.Color(0x476bbd);
        this.scene.fog.fogDensity = 0.01;
    }

    focusContinent(continent = 'AMERICA DO SUL') {
        // Mapping of continents to rotation angles (Euler angles in radians)
        const continentAngles = {
            'AMERICA DO NORTE': { x: 0.15, y: -2.00 },
            'AMERICA DO SUL': { x: -0.90, y: -2.55 },
            'EUROPA': { x: 0.45, y: 2.25 },
            'AFRICA': { x: -0.55, y: 2.50 },
            'ASIA': { x: 0.20, y: 1.10 },
            'OCEANIA': { x: -0.95, y: -5.85 },
        };

        const target = continentAngles[continent.toUpperCase()] || { x: 0, y: 0 };
        this.targetRotation = { x: target.x, y: target.y };
        console.log(`Focusing ${continent}:`, target);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.globe) {
            // Smoothly interpolate to target rotation
            this.globe.rotation.x += (this.targetRotation.x - this.globe.rotation.x) * 0.02;
            this.globe.rotation.y += (this.targetRotation.y - this.globe.rotation.y) * 0.02;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
