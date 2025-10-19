class World {
    constructor(){
        this.projectileId = -1;

        this.particles = []

        this.width = 5000;
        this.height = 5000;

        this.friction = 0.92

        this.animationId;

        this.squareSize = 50;
        this.grid = []
        this.isGridInit = false;

        this.totalSquares = 0;
        this.friendlySquares = 0;
        this.enemySquares = 0;
        this.friendlyPercentageCounterHTML = document.querySelector(".percentage-container .friendly");
        this.enemyPercentageCounterHTML = document.querySelector(".percentage-container .enemy");

        this.hps = [];
        this.maxHps = 3;
        this.lastHpSpawn = Date.now();
        this.ens = [];
        this.maxEns = 1;
        this.lastEnSpawn = Date.now();
        this.collectibles = [];
        this.breakBetweenSpawns = 2000;

        this.secondPhase = false;
        this.thirdPhase = false;

        this.paused = false;

        messageLogAnimation("Phase 1", "rgb(153,0,204)", 5);

    }
    initGrid() {
        const cols = Math.ceil(this.width / this.squareSize);
        const rows = Math.ceil(this.height / this.squareSize);

        for (let y = 0; y < rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < cols; x++) {
                this.grid[y][x] = {
                    contaminatedBy: new Set(), 
                    contaminationLevel: 0,
                    type: null
                };
            }
        }
    }
    drawGridFor(player) {
        const cols = this.grid[0].length;
        const rows = this.grid.length;

        // Keep world statistics objective
        this.totalSquares = cols * rows;
        this.friendlySquares = 0;
        this.enemySquares = 0;

        // Calculate player's world position in grid coordinates
        const playerGridX = Math.floor(player.x / this.squareSize);
        const playerGridY = Math.floor(player.y / this.squareSize);

        // How many cells around the player to render (1000px radius)
        
        let rad = (canvas.width / 2) / player.zoomFactor;
        
        const renderRadius = Math.ceil(rad / this.squareSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = this.grid[y][x];

                // Update world-wide contamination stats
                if (cell.type === "enemy" || cell.type === "evil-enemy") {
                    this.enemySquares++;
                } else if (cell.type === "friendly") {
                    this.friendlySquares++;
                }

                // Only draw if the cell is within the render range
                if (
                    Math.abs(x - playerGridX) <= renderRadius &&
                    Math.abs(y - playerGridY) <= renderRadius
                ) {
                    const xPos = x * this.squareSize - player.camera.x;
                    const yPos = y * this.squareSize - player.camera.y;

                    c.beginPath();
                    c.rect(xPos, yPos, this.squareSize, this.squareSize);

                    if (cell.type === "enemy") {
                        c.strokeStyle = `rgba(${enemy.gridColor}, ${cell.contaminationLevel})`;
                    } else if(cell.type === "evil-enemy"){
                        c.strokeStyle = `rgba(${enemy.evilGridColor}, ${cell.contaminationLevel})`;
                    } else if (cell.type === "friendly") {
                        c.strokeStyle = `rgba(0,255,255, ${cell.contaminationLevel})`;
                    } else {
                        c.strokeStyle =`rgba(255,255,255, ${browserDependentAlpha})`;
                    }

                    c.stroke();
                }
            }
        }
    }

    getGainPercentage(){
        let segment = {
            friendly:  ((this.friendlySquares / this.totalSquares) * 100).toFixed(1),
            enemy: ((this.enemySquares / this.totalSquares) * 100).toFixed(1)
        }

        this.friendlyPercentageCounterHTML.innerHTML = segment.friendly + "%";
        this.enemyPercentageCounterHTML.innerHTML = segment.enemy + "%";
    };
    
    particleBlast(n, x, y, color, spread){
        for(let i = 0; i < n; i++){
            new World.Particle(this, x, y, color, spread)
        }
    }
    handleCollectibles(){
        const now = Date.now();
        if(this.hps.length < this.maxHps && now - this.lastHpSpawn > this.breakBetweenSpawns){
            const col = new World.Collectible(this, 
                300 + Math.random() * (this.width - 300),
                300 + Math.random() * (this.height - 300), 
                Math.random(), 0.2, "white", "HP", "hp"
            )
            this.lastHpSpawn = now
            this.hps.push(col)
        }
        if(this.ens.length < this.maxEns && now - this.lastEnSpawn > this.breakBetweenSpawns){
            const col = new World.Collectible(this, 
                300 + Math.random() * (this.width - 300),
                300 + Math.random() * (this.height - 300), 
                10 + Math.random() * 5, 0.4, 
                "rgb(0,255,255)", "E", "en"
            )
            this.lastEnSpawn = now
            this.ens.push(col)
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        c.save();
        c.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
        c.fillRect(0, 0, canvas.width, canvas.height);

        c.translate(canvas.width / 2, canvas.height / 2);
        c.scale(player.zoomFactor, player.zoomFactor);
        c.translate(-canvas.width / 2, -canvas.height / 2);


        if (!this.isGridInit) {
            this.initGrid();
            this.isGridInit = true;
        }
        this.drawGridFor(player);


        // update entities
        this.particles.forEach((p) => {
            p.draw(player.camera);
            p.update();
        })
        enemy.update(player.camera);
        asteroid.update(player.camera)
        
        
        player.spawners.forEach((s) => {
            s.draw(player.camera);
            s.update();
        });
        player.allies.forEach((a) => {
            a.draw(player.camera);
            a.update();
        });
        player.update(player.camera);
        player.drawFlash();

        this.collectibles.forEach((c) => {
            c.draw(player.camera);
            c.update();
        })

        c.restore();

        if(((this.enemySquares / this.totalSquares) * 100).toFixed(1) > 90) player.lose();
        if(((this.friendlySquares / this.totalSquares) * 100).toFixed(1) > 95 && this.thirdPhase) player.win();

        // Set to second phase;
        if (((this.friendlySquares / this.totalSquares) * 100).toFixed(1) > 90 && !this.secondPhase && !this.thirdPhase){
            messageLogAnimation("Phase 2", "rgb(153,0,204)", 5);
            this.width = 7500;
            this.height = 7500;

            for(let i = 0; i < 5; i++){
                let c = {
                    x: Math.random() * 7500,
                    y: Math.random() * 7500
                }
                while(c.x > 0 && c.x < 5000 && c.y > 0 && c.y < 5000){
                    c = {
                        x: Math.random() * 7500,
                        y: Math.random() * 7500
                    }
                }
                new EnemyLauncher.Enemy(enemy, c.x, c.y, 80 + Math.random() * 10, 3);
            }

            asteroid.awaitTime = 40000;
            asteroid.numberPerlaunch = 3;
            enemy.crazyHuntDuration = 10000;
            enemy.crazyHuntBreak = 30000;

            player.shootCoolDown = 120;
            player.rechargeStep = 0.4;
            player.allyShootInterval = 200;

            this.maxHps = 6;
            this.maxEns = 2;

            this.initGrid();

            const self = this;
            setTimeout(() => {
                self.secondPhase = true;

            })
        }
        if (((this.friendlySquares / this.totalSquares) * 100).toFixed(1) > 90 && this.secondPhase && !this.thirdPhase){
            messageLogAnimation("Phase 3", "rgb(153,0,204)", 5);
            this.width = 10000;
            this.height = 10000;

            for(let i = 0; i < 10; i++){
                let c = {
                    x: Math.random() * 10000,
                    y: Math.random() * 10000
                }
                while(c.x > 0 && c.x < 7500 && c.y > 0 && c.y < 7500){
                    c = {
                        x: Math.random() * 10000,
                        y: Math.random() * 10000
                    }
                }
                new EnemyLauncher.EvilSpawner(enemy, c.x, c.y, 80 + Math.random() * 10, 3);
            }

            asteroid.awaitTime = 40000;
            asteroid.numberPerlaunch = 4;

            player.shootCoolDown = 100;
            player.rechargeStep = 0.5;
            player.spawnRate = 7000;

            this.maxHps = 8;
            this.maxEns = 3;

            this.initGrid();

            setTimeout(() => {
                self.thirdPhase = true;
            })
        }

        this.getGainPercentage()
        this.handleCollectibles()
        console.log(this.secondPhase, this.thirdPhase)
    }

    pauseResume(){
        if(!this.paused) {
            cancelAnimationFrame(this.animationId);
            this.paused = true;
            
            enemy.pauseResume();
            asteroid.pauseResume();
            player.pauseResume();

            gameStatsHTML.style.display = "none";
            pauseScreenHTML.style.display = "flex"

            homeButtonImgHTML.src = "assets/cyan-home-icon.png"
            homeButtonHTML.style.display = "block"

            this.displayCanvasMessage("Paused", "rgb(0,255,255)")
        } else {
            this.animate();
            this.paused = false;

            enemy.pauseResume();
            asteroid.pauseResume();
            player.pauseResume();

            gameStatsHTML.style.display = "block";
            pauseScreenHTML.style.display = "none";
            homeButtonHTML.style.display = "none"

            c.lineWidth = 1;
        }
    }
    displayCanvasMessage(text, color){
        c.font = "80px Arial";
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.strokeText(text, 20, 100);
    }

    static Particle = class {
        constructor(owner, x, y, color, spread){
            this.owner = owner;

            this.x = x;
            this.y = y;
            this.spread = spread
            this.v = {
                x: (Math.random() * getRandomSign()) * (Math.random() * this.spread),
                y: (Math.random() * getRandomSign()) * (Math.random() * this.spread)
            };

            this.radius = Math.random() * 3;
            this.color = color
            this.alpha = 1;

            owner.particles.push(this)
        }
        remove(){
            const index = this.owner.particles.indexOf(this);
            if (index !== -1) this.owner.particles.splice(index, 1);
        }
        draw(camera){
            c.save();
            c.globalAlpha = this.alpha;
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
            c.restore();
        }
        update(){
            this.x += this.v.x;
            this.y += this.v.y;
            this.alpha -= 0.005;
            
            if(this.alpha <= 0){
                this.remove();
            }
        }
    }

    static Collectible = class {
        constructor(owner, x, y, speed, growFactor, color, text, type){
            this.owner = owner;
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.growFactor = growFactor;
            this.color = color;
            this.text = text;
            this.type = type;

            this.v = {
                x:  Math.cos(Math.random() * Math.PI * 2) * this.speed,
                y:  Math.cos(Math.random() * Math.PI * 2) * this.speed
            }

            this.minRadius = 20;
            this.radius = 30;
            this.maxRadius = 40;

            this.trackTime = Date.now();
            this.spawnTime = Date.now();
            this.lifeTime = 10000
            this.oneDirectionDuration = 3000;
            this.growing = true;
            this.font = 25;
            
            this.alpha = 1;
            this.minAlpha = 0.3;
            this.maxAlpha = 1;
            this.alphaFactor = 0.05
            this.pulsing = false;

            this.owner.collectibles.push(this)
        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            
            c.strokeStyle = this.color;
            c.stroke();
            
            c.font = `${this.font}px Arial`
            c.textAlign = "center";      
            c.textBaseline = "middle"; 

            c.fillStyle = this.color;
            c.fillText(this.text, this.x - camera.x, this.y - camera.y)
            
        }
        update(){
            const now = Date.now();

            if(now - this.spawnTime > this.lifeTime - 3000) this.pulsing = true;
            if(now - this.spawnTime > this.lifeTime) this.remove();

            let additionalFactor;

            
                const distance = Math.hypot(
                    player.x - this.x, 
                    player.y - this.y
                );

                if(this.type === "hp") additionalFactor = player.hp < 5;
                else additionalFactor = true;

                if(distance - this.radius - player.radius < 200 && additionalFactor){
                    const angle = Math.atan2(
                        player.y - this.y,
                        player.x - this.x
                    );
                    const v = {
                        x: Math.cos(angle) * 12,
                        y: Math.sin(angle) * 12
                    };

                    this.v.x = v.x;
                    this.v.y = v.y
                }


            // change direction every oneDirectionDuration
            if (now - this.trackTime > this.oneDirectionDuration) {
                this.v.x = Math.cos(Math.random() * Math.PI * 2) * this.speed;
                this.v.y = Math.sin(Math.random() * Math.PI * 2) * this.speed;
                this.trackTime = now;
            }

            // movement
            this.x += this.v.x;
            this.y += this.v.y;

            // keep inside world bounds
            this.x = Math.max(this.radius, Math.min(this.x, world.width - this.radius));
            this.y = Math.max(this.radius, Math.min(this.y, world.height - this.radius));


            // size pulsing
            if (this.growing) {
                this.radius += this.growFactor;
                this.font += this.growFactor;
                if (this.radius >= this.maxRadius) {
                    this.radius = this.maxRadius;
                    this.growing = false;
                }
            } else {
                this.radius -= this.growFactor;
                this.font -= this.growFactor;
                if (this.radius <= this.minRadius) {
                    this.radius = this.minRadius;
                    this.growing = true;
                }
            }

            // opacity pulsing
            if (this.pulsing) {
                this.alpha += this.alphaFactor * (this.alphaDirection || -1); 

                if (this.alpha <= this.minAlpha) {
                    this.alpha = this.minAlpha;
                    this.alphaDirection = 1;  // go up
                }
                if (this.alpha >= this.maxAlpha) {
                    this.alpha = this.maxAlpha;
                    this.alphaDirection = -1; // go down
                }
            } else {
                this.alpha = 1; // always visible
            }

            if(this.type === "hp") this.color = `rgba(255, 255, 255, ${this.alpha})`
            else if(this.type === "en")this.color = `rgba(0, 255, 255, ${this.alpha})`
        }
        remove(){
            const index = this.owner.collectibles.indexOf(this);
            if (index !== -1) this.owner.collectibles.splice(index, 1);

            if(this.type === "hp"){
                const index = this.owner.hps.indexOf(this);
                if (index !== -1) this.owner.hps.splice(index, 1);
            } else if (this.type === "en"){
                const index = this.owner.ens.indexOf(this);
                if (index !== -1) this.owner.ens.splice(index, 1);
            }
        }
        applyEnEffect(player){
            player.enActivated = true;
            setTimeout(function(){
                player.enActivated = false;
            }, 3000)
        }
    }
    
}

