import { writable } from 'svelte/store';

export type SnackbarOptions = {
	message: string;
	duration?: number;
	actions?: { label: string; callback: () => void }[];
	position?: 'center' | 'left' | 'right';
};

export const snackbar = writable<SnackbarOptions | null>(null);

export const CLOSE_SNACKBAR = () => snackbar.set(null);

export function emitError(msg: string): void {
	snackbar.set({
		message: `Error: ${msg}`,
		duration: 5000,
		actions: [{ label: 'Close', callback: CLOSE_SNACKBAR }],
		position: 'center'
	});
}

export function emitNotification(msg: string): void {
	snackbar.set({
		message: msg,
		duration: 3000,
		position: 'center'
	});
}