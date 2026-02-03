class AudioController {
    constructor() {
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
        audio.volume = audio.muted ? 0 : this.defaultVolumes[key];
        if (audio.ended || audio.paused) {
            audio.play().catch(e => console.warn("Audio play blocked", e));
        } else {
            const clone = audio.cloneNode();
            clone.volume = audio.muted ? 0 : this.defaultVolumes[key];
            clone.play().catch(e => console.warn("Audio play blocked", e));
            clone.onended = () => {
                clone.remove();
                console.log("Audio ended, clone removed");
            };
        }
    }
    pause(key) {
        this.sounds[key].pause();
    }

    toggleMute() {
        for (let key in this.sounds) {
            this.sounds[key].muted = !this.sounds[key].muted;
            this.sounds[key].volume = this.sounds[key].muted ? 0 : this.defaultVolumes[key];
        }
    }
}
