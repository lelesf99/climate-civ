class AudioController {
    constructor() {
        this.isMuted = false;
        this.sounds = {
            'click': new Audio('assets/audio/click.mp3'),
            'success': new Audio('assets/audio/success.wav'),
            'fail': new Audio('assets/audio/fail.wav'),
            'alarm': new Audio('assets/audio/disaster_alarm.wav'),
            'ambiance': new Audio('assets/audio/ambiance.ogg'),
            'confirm': new Audio('assets/audio/red_btn.wav')
        };
        // Default volumes
        this.defaultVolumes = {
            'alarm': 0.3,
            'ambiance': 0.5,
            'click': 0.1,
            'confirm': 0.5,
            'fail': 0.5,
            'success': 0.5
        };
        this.sounds.alarm.volume = this.defaultVolumes.alarm;
        this.sounds.ambiance.volume = this.defaultVolumes.ambiance;
        this.sounds.click.volume = this.defaultVolumes.click;
        this.sounds.confirm.volume = this.defaultVolumes.confirm;
        this.sounds.fail.volume = this.defaultVolumes.fail;
        this.sounds.success.volume = this.defaultVolumes.success;

        this.sounds.alarm.loop = true;
        this.sounds.ambiance.loop = true;

        this.printVolumes();
    }

    printVolumes() {
        for (let key in this.sounds) {
            console.log(key, this.sounds[key].volume);
        }
    }

    play(key) {
        const audio = this.sounds[key];
        if (!audio) return;

        audio.volume = this.isMuted ? 0 : this.defaultVolumes[key];

        // If it's a looping sound (background), don't clone it
        if (audio.loop) {
            if (audio.paused) {
                audio.play().catch(e => console.warn("Audio play blocked", e));
            }
            return;
        }

        // For one-shot sounds, allow cloning for overlaps
        if (audio.ended || audio.paused) {
            audio.play().catch(e => console.warn("Audio play blocked", e));
        } else {
            const clone = audio.cloneNode();
            clone.volume = this.isMuted ? 0 : this.defaultVolumes[key];
            clone.play().catch(e => console.warn("Audio play blocked", e));
            clone.onended = () => {
                clone.remove();
            };
        }
    }
    pause(key) {
        this.sounds[key].pause();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        for (let key in this.sounds) {
            this.sounds[key].muted = this.isMuted;
            this.sounds[key].volume = this.isMuted ? 0 : this.defaultVolumes[key];
        }
        return this.isMuted;
    }
}
