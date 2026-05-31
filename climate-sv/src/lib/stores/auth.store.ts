import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export const authUser = writable<User | null>(null);
export const authLoading = writable(true);

if (typeof window !== 'undefined') {
	onAuthStateChanged(auth, (user) => {
		authUser.set(user);
		authLoading.set(false);
	});
}