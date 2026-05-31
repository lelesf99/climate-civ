import { writable } from 'svelte/store';

type SoundKey = 'click' | 'success' | 'fail' | 'ambiance' | 'confirm';

const SOUND_PATHS: Record<SoundKey, string> = {
	click: '/audio/click.mp3',
	success: '/audio/success.wav',
	fail: '/audio/fail.wav',
	ambiance: '/audio/ambiance.ogg',
	confirm: '/audio/red_btn.wav'
};

const DEFAULT_VOLUMES: Record<SoundKey, number> = {
	ambiance: 0.15,
	click: 0.1,
	confirm: 0.5,
	fail: 0.5,
	success: 0.5
};

const LOOPING_SOUNDS: SoundKey[] = ['ambiance'];

export const isMuted = writable<boolean>(false);

let sounds: Record<string, HTMLAudioElement> | null = null;
let _isMuted = false;
let _ambianceStarted = false;
let _fadeAnimationId: number | null = null;

isMuted.subscribe((v) => (_isMuted = v));

function ensureSounds(): Record<string, HTMLAudioElement> {
	if (typeof window === 'undefined') return {};
	if (sounds) return sounds;

	sounds = {};
	for (const [key, path] of Object.entries(SOUND_PATHS)) {
		const audio = new Audio(path);
		audio.volume = DEFAULT_VOLUMES[key as SoundKey] ?? 0.5;
		if (LOOPING_SOUNDS.includes(key as SoundKey)) {
			audio.loop = true;
		}
		sounds[key] = audio;
	}
	return sounds;
}

export function playSound(key: SoundKey, fadeDurationMs = 0): void {
	const all = ensureSounds();
	const audio = all[key];
	if (!audio) return;

	if (audio.loop) {
		// For looping sounds (ambiance), only start once
		if (_ambianceStarted && key === 'ambiance') return;

		const targetVolume = DEFAULT_VOLUMES[key] ?? 0.5;

		if (fadeDurationMs > 0) {
			// Start silent and fade in
			audio.volume = 0;
			audio.muted = _isMuted;
			audio.play().then(() => {
				_ambianceStarted = true;

				// Cancel any existing fade
				if (_fadeAnimationId !== null) {
					cancelAnimationFrame(_fadeAnimationId);
				}

				const startTime = performance.now();
				const fadeStep = (time: number) => {
					const elapsed = time - startTime;
					const progress = Math.min(elapsed / fadeDurationMs, 1);
					// Always set the actual volume (muted property handles silencing)
					audio.volume = progress * targetVolume;

					if (progress < 1 && !audio.paused) {
						_fadeAnimationId = requestAnimationFrame(fadeStep);
					} else {
						_fadeAnimationId = null;
					}
				};
				_fadeAnimationId = requestAnimationFrame(fadeStep);
			}).catch((e) => console.warn('Audio play blocked:', e));
		} else {
			audio.volume = _isMuted ? 0 : targetVolume;
			audio.muted = _isMuted;
			audio.play().then(() => {
				_ambianceStarted = true;
			}).catch((e) => console.warn('Audio play blocked:', e));
		}
		return;
	}

	// Non-looping sounds (click, success, fail, confirm)
	if (_isMuted) return; // Don't play SFX when muted

	if (audio.ended || audio.paused) {
		audio.volume = DEFAULT_VOLUMES[key] ?? 0.5;
		audio.play().catch((e) => console.warn('Audio play blocked', e));
	} else {
		const clone = audio.cloneNode() as HTMLAudioElement;
		clone.volume = DEFAULT_VOLUMES[key] ?? 0.5;
		clone.play().catch((e) => console.warn('Audio play blocked', e));
		clone.onended = () => clone.remove();
	}
}

export function pauseSound(key: SoundKey): void {
	const all = ensureSounds();
	const audio = all[key];
	if (audio) audio.pause();
}

export function toggleMute(): boolean {
	const next = !_isMuted;
	isMuted.set(next);

	const all = ensureSounds();
	for (const key in all) {
		const audio = all[key];
		audio.muted = next;

		if (!next) {
			// Unmuting: restore proper volume
			audio.volume = DEFAULT_VOLUMES[key as SoundKey] ?? 0.5;

			// If ambiance was started but got paused somehow, resume it
			if (LOOPING_SOUNDS.includes(key as SoundKey) && audio.paused && _ambianceStarted) {
				audio.play().catch((e) => console.warn('Audio resume blocked', e));
			}
		}
	}

	return next;
}
