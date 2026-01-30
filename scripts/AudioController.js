class AudioController {
    constructor() {
        this.muted = false;
        this.volume = 0.5;
        this.sounds = {};
        
        // Sound Dictionary - User provided
        this.sources = {
            'click': 'assets/audio/click.mp3',
            'success': 'assets/audio/success.wav',
            'fail': 'assets/audio/fail.wav',
            'alarm': 'assets/audio/disaster_alarm.wav',
            'ambiance': 'assets/audio/ambiance.ogg',
            'confirm': 'assets/audio/red_btn.wav'
        };

        this.preload();
        
        this.ambianceTrack = null;
        this.alarmTrack = null;
    }

    preload() {
        for (let key in this.sources) {
            const audio = new Audio(this.sources[key]);
            audio.volume = this.volume;
            
            // Custom Volume Adjustments
            if (key === 'alarm') {
                 audio.volume = this.volume * 0.2; // 20% volume for alarm (Lowered again)
            }
            if (key === 'fail') {
                 audio.volume = this.volume * 0.4; // 40% volume for fail
            }
            
            this.sounds[key] = audio;
            
            // Log errors
            audio.onerror = () => {
                console.warn(`Failed to load sound: ${key} from ${this.sources[key]}`);
            };
        }
    }

    play(key) {
        if (this.muted) return;
        
        const sound = this.sounds[key];
        if (sound) {
            // Clone node to allow overlapping sounds (rapid clicks)
            const clone = sound.cloneNode();
            
            // Apply specific volume again to clones
            if (key === 'alarm') {
                clone.volume = this.volume * 0.2;
            } else if (key === 'fail') {
                clone.volume = this.volume * 0.4;
            } else {
                clone.volume = this.volume;
            }

            clone.play().catch(e => console.warn("Audio play blocked", e));
        } else {
             // Silently fail
        }
    }

    playAlarm() {
        if (this.muted) return;

        if (!this.alarmTrack) {
            this.alarmTrack = this.sounds['alarm'];
            if (this.alarmTrack) {
                this.alarmTrack.loop = true; // Loop the alarm
                this.alarmTrack.volume = this.volume * 0.2;
            }
        }

        if (this.alarmTrack) {
            this.alarmTrack.play().catch(e => console.log("Alarm play blocked"));
        }
    }

    stopAlarm() {
        if (this.alarmTrack) {
            this.alarmTrack.pause();
            this.alarmTrack.currentTime = 0;
        }
    }

    playAmbiance() {
        if (this.muted) return;
        
        if (!this.ambianceTrack) {
            this.ambianceTrack = this.sounds['ambiance'];
            if (this.ambianceTrack) {
                this.ambianceTrack.loop = true;
                this.ambianceTrack.volume = this.volume * 0.5; // Lower volume for BG
            }
        }
        
        if (this.ambianceTrack) {
            this.ambianceTrack.play().catch(e => console.log("Ambiance autoplay blocked"));
        }
    }

    stopAmbiance() {
        if (this.ambianceTrack) {
            this.ambianceTrack.pause();
            this.ambianceTrack.currentTime = 0;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        
        if (this.muted) {
            this.stopAmbiance();
        } else {
            this.playAmbiance();
        }
        
        return this.muted;
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        for (let key in this.sounds) {
            this.sounds[key].volume = this.volume;
        }
        if (this.ambianceTrack) {
            this.ambianceTrack.volume = this.volume * 0.5;
        }
    }
}
