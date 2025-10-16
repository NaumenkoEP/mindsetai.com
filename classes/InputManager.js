class InputManager {
    constructor() {
        this.players = world.players; 
        this._initListeners()
    }
    _initListeners() {
        // movement 
        window.addEventListener('keydown', (e) => {
            this.players.forEach(player => {
                switch (e.code) {
                    case "KeyD": player.keys.d = true; break;
                    case "KeyA": player.keys.a = true; break;
                    case "KeyW": player.keys.w = true; break;
                    case "KeyS": player.keys.s = true; break;
                }
            });
        });
        window.addEventListener('keyup', (e) => {
            this.players.forEach(player => {
                switch (e.code) {
                    case "KeyD": player.keys.d = false; break;
                    case "KeyA": player.keys.a = false; break;
                    case "KeyW": player.keys.w = false; break;
                    case "KeyS": player.keys.s = false; break;
                }
            });
        });

        // mouse movement
        document.addEventListener('mousemove', (e) => {
            this.players.forEach(player => {
                player.renderMouse(e);
            });
        });

        // zoom controls 
        document.addEventListener('keydown', (e) => {
            this.players.forEach(player => {
                if(!world.paused){
                    if (e.key === '=' || e.key === '+') player.zoomIn();
                    if (e.key === '-' || e.key === '_') player.zoomOut();
                }
            });
        });

        // shoot
        document.addEventListener('mousedown', (e) => {
            this.players.forEach(player => {
                if (e.button === 0) player.mouseHeld = true;
            });
        });
        document.addEventListener('mouseup', (e) => {
            this.players.forEach(player => {
                if (e.button === 0) player.mouseHeld = false;
            });
        });

        // blast
        document.addEventListener('keydown', (e) => {
            this.players.forEach((player) => {
                if(e.key === " " || e.code === "Space"){
                    if(!world.paused) player.blast();
                    e.preventDefault(); 
                }
            });
        })

        // launch spawner
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault(); 
            player.launchSpawner()
        });

        // pause
        document.addEventListener('keydown', (e) => {
            if(e.key === "Escape" || e.key === "p"){
                world.pauseResume();
                e.preventDefault();
            }
        })
    }
}
