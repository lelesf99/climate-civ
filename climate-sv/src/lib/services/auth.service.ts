import { signInAnonymously, signInWithEmailAndPassword, signOut, type UserCredential } from "firebase/auth";
import { DataSnapshot, get, ref } from "firebase/database";
import { auth, realTimeDB } from "../../firebase/config";

export function teacherLogin(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, password);
}
export function teacherLogOut() {
    return signOut(auth);
}
export function studentLogin(): Promise<UserCredential> {
    return signInAnonymously(auth);
}
export function joinSession(sessionCode: string): Promise<DataSnapshot> {
    const sessionRef = ref(realTimeDB, `sessions/${sessionCode}`);
    return get(sessionRef);
}