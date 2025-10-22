class SoundManager {
    constructor(){
        // player sounds
        this.shoot = document.querySelector(".shoot-sound");
        this.engineHumming = document.querySelector(".engine-sound");
        this.pickUp = document.querySelector(".pickup-sound");
        this.hit = document.querySelector(".hit-sound")

        // entity sounds
        this.spawnerBlast = document.querySelector(".spawnerblast-sound");
        this.asteroidBlast = document.querySelector(".asteroidblast-sound");
        this.entityHit = document.querySelector(".entityhit-sound");
        this.spawn = document.querySelector("spawn-soun");
    }
    static playSound(soundHTML, rate, loopBool){
        try {
            if (soundHTML) {
                soundHTML.playbackRate = rate; // 1 is 100% of its speed
                soundHTML.loop = loopBool; // if it loops or not
                soundHTML.play();
            }
        } catch (e) {
            console.log("No sound");
        }
    }
}

// exmaple of usage
