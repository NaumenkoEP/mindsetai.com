class InputManager {
    constructor() {
        this._initListeners()
    }
    _initListeners() {
        // movement 
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case "KeyD": player.keys.d = true; break;
                case "KeyA": player.keys.a = true; break;
                case "KeyW": player.keys.w = true; break;
                case "KeyS": player.keys.s = true; break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case "KeyD": player.keys.d = false; break;
                case "KeyA": player.keys.a = false; break;
                case "KeyW": player.keys.w = false; break;
                case "KeyS": player.keys.s = false; break;
            }
        });

        // mouse movement
        document.addEventListener('mousemove', (e) => {
            player.renderMouse(e);
        });

        // zoom controls 
        document.addEventListener('keydown', (e) => {
            if(!world.paused){
                if (e.key === '=' || e.key === '+') player.zoomIn();
                if (e.key === '-' || e.key === '_') player.zoomOut();
            }
        });

        // shoot
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) player.mouseHeld = true;
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) player.mouseHeld = false;
        });

        // blast
        document.addEventListener('keydown', (e) => {
            if(e.key === " " || e.code === "Space"){
                if(!world.paused) player.blast();
                e.preventDefault(); 
            }
        })

        // launch spawner
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault(); 
            player.launchEntity();
        });

        // pause
        document.addEventListener('keydown', (e) => {
            if(e.key === "Escape" || e.key === "p"){
                world.pauseResume();
                e.preventDefault();
            }
        })

        // switch entities
        document.addEventListener('keydown', (e) => {
            if(e.key === "1"){
                player.spawnerDisplayHTML.style.transform = "scale(1.2)";
                player.towerDisplayHTML.style.transform = "scale(1)"
                player.spawnerForSale = true;
                player.towerForSale = false;
            } else if(e.key === "2" && world.secondPhase){
                player.spawnerDisplayHTML.style.transform = "scale(1)";
                player.towerDisplayHTML.style.transform = "scale(1.2)";
                player.spawnerForSale = false;
                player.towerForSale = true;
            }
        })
    }
}
