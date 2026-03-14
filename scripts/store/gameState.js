import { BehaviorSubject, Subject } from 'rxjs';

// --- State Definitions ---

export const Role = {
    TEACHER: 'teacher',
    PLAYER: 'player',
    NONE: null
};

export const GamePhase = {
    LOGIN: 'login',
    ROLE_SELECTION: 'role_selection',
    TEACHER_SETUP: 'teacher_setup',
    PLAYER_JOIN: 'player_join',
    LOBBY: 'lobby',          // Waiting to start
    ACTIVE: 'active',        // Round running
    RESULTS: 'results',      // Round over, seeing feedback
    FINISHED: 'finished'     // Game over fully
};

// --- Single Source of Truth ---

class AppStore {
    constructor() {
        // Core Identity
        this.role$ = new BehaviorSubject(Role.NONE);
        this.uid$ = new BehaviorSubject(null);
        
        // Navigation / High-level App Phase
        this.phase$ = new BehaviorSubject(GamePhase.ROLE_SELECTION);
        
        // Session / Game sync
        this.sessionCode$ = new BehaviorSubject(null);
        this.sessionData$ = new BehaviorSubject(null);
        
        // Global Errors / Notifications (Subscriptions to this show Toast/Alerts)
        this.errors$ = new Subject();
        this.notifications$ = new Subject();
        
        // UI Sub-states
        this.loading$ = new BehaviorSubject(false);
        this.refreshSessions$ = new Subject();
    }

    // Helpers to easily snapshot sync data
    get session() { return this.sessionData$.getValue(); }
    get code() { return this.sessionCode$.getValue(); }
    get role() { return this.role$.getValue(); }
    get uid() { return this.uid$.getValue(); }

    // Dispatchers
    setRole(role) { this.role$.next(role); }
    setPhase(phase) { this.phase$.next(phase); }
    setSession(code, initialData = null) {
        this.sessionCode$.next(code);
        if (initialData) this.sessionData$.next(initialData);
    }
    updateSessionData(data) { this.sessionData$.next(data); }
    setUid(uid) { this.uid$.next(uid); }
    
    setLoading(isLoading) { this.loading$.next(isLoading); }
    
    emitError(errorMsg) { this.errors$.next(errorMsg); }
    emitNotification(msg) { this.notifications$.next(msg); }

    reset() {
        this.role$.next(Role.NONE);
        this.uid$.next(null);
        this.phase$.next(GamePhase.ROLE_SELECTION);
        this.sessionCode$.next(null);
        this.sessionData$.next(null);
        this.loading$.next(false);
    }
}

export const store = new AppStore();
