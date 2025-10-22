class Player {
    constructor(x, y, color){
        this.x = x;
        this.y = y;
        this.vx = 5;
        this.vy = 5;
        this.acceleration = 1;

        this.radius = 15;
        this.color = color;

        this.keys = { d: false, a: false, w: false, s: false }

        this.zoomFactor = 1;

        this.canvasRect = () => canvas.getBoundingClientRect();
        this.mouse = {sx: canvas.width / 2, sy: canvas.height / 2}
        this.cursor = document.querySelector(".custom-cursor");
        this.cursorSize = 15

        this.camera = new Player.Camera(this);

        this.laser = new Player.Laser(this);
        this.laserColor = "rgba(0, 255, 255, 0.5)";

        this.mouseHeld = false;
        this.lastShotTime = 0;
        this.shootCooldown = 150;
        this.energy = 0;
        this.enActivated = false;
        this.energyBarHTML = document.querySelector(".energy-bar")
        this.maxEnergy = 40;
        this.recharging = false;
        this.rechargeStep = 0.3;
        this.projectileStats = {
            speed: 15,
            radius: 5,
            color: "rgba(0, 255, 255, 1)",
            lifeDuration: 3000
        }
        this.projectilesPerBlast = 72;
        this.projectiles = [];
        this.projectileTargets = [];

        this.allies = [];
        this.allyShootInterval = 400;
        this.spawners = [];
        this.spawnRate = 10000;
        this.spawnerPrice = 50;
        this.spawnerDisplayHTML = document.querySelector(".spawner-display")
        this.spawnerPriceCounterHTML = document.querySelector(".spawner-display .price-display .price-counter")
        this.spawnerForSale = true;


        this.towers = [];
        this.towerPrice = 100;
        this.towerDisplayHTML = document.querySelector(".tower-display");
        this.towerPriceCounterHTML = document.querySelector(".tower-display .price-display .price-counter")
        this.towerForSale = false;

        this.coins = 0;
        this.coinCounterHTML = document.querySelector(".coins-display span")
        this.hp = 5;
        this.immunityDuration = 500;
        this.lastHitTime = Date.now();        
        
        this.mapRadius = 1;
        this.mapColor = this.color

        this.flashTimer = 0;
        this.flashDuration = 100;
        this.flashColor = "255,255,255"

        this.dead = false;

        map.objects.push(this);

        this.paused = false;
        this.pauseTime = null;
        
    }
    pauseResume() {
        if (!this.paused) {
            this.paused = true;
            this.pauseTime = Date.now();
        } else if (this.paused) {
            const delta = Date.now() - this.pauseTime;
            this.paused = false;

            this.spawners.forEach(s => s.lastSpawn += delta);
        }
    }

    draw(){
        c.beginPath();
        c.arc(this.x - this.camera.x, this.y - this.camera.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update(camera){
        this.laser.update();
        
        this.handleShooting();

        this.projectiles.forEach((p) => {
            p.draw(camera);
            p.update();
        });

        this.resolveAllyCollision();

        this.camera.update();
        
        this.coinCounterHTML.innerHTML = this.coins;

        if(this.coins < this.spawnerPrice) this.spawnerDisplayHTML.style.opacity = 0.5
        else this.spawnerDisplayHTML.style.opacity = 1;
        this.spawnerPriceCounterHTML.innerHTML = this.spawnerPrice;

        if(world.secondPhase){
             if(this.coins < this.towerPrice) this.towerDisplayHTML.style.opacity = 0.5
            else this.towerDisplayHTML.style.opacity = 1;
            this.towerPriceCounterHTML.innerHTML = this.towerPrice;
        }


        if (this.keys.d) this.vx += this.acceleration;
        if (this.keys.a) this.vx -= this.acceleration;
        if (this.keys.w) this.vy -= this.acceleration;
        if (this.keys.s) this.vy += this.acceleration;

        this.vx *= world.friction;
        this.vy *= world.friction;

        if(!this.dead){
            this.x += this.vx;
            this.y += this.vy;
        }
            

        if (this.x + this.radius > world.width) {
            this.x = world.width - this.radius;
            this.vx = 0; 
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = 0;
        }
        if (this.y + this.radius > world.height) {
            this.y = world.height - this.radius;
            this.vy = 0; 
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = 0;
        }

        if(this.hp < 1) {
            this.die();
        }

        this.collectiblesScan();

        this.draw();
    
    }
    flash(color, duration){
        this.flashColor = color;
        this.flashStart = Date.now();
        this.flashDuration = duration;
    }
    drawFlash() {
        if (!this.flashStart) return;
        const elapsed = Date.now() - this.flashStart;

        if (elapsed < this.flashDuration) {
            const alpha = 1 - elapsed / this.flashDuration;

            c.save();

            c.setTransform(1, 0, 0, 1, 0, 0);

            c.fillStyle = `rgba(${this.flashColor}, ${alpha})`;
            c.fillRect(0, 0, canvas.width, canvas.height);

            c.restore();
        } else {
            this.flashStart = null;
        }
    }

    zoomIn(){
        this.zoomFactor *= 2; 
        this.cursorSize *= 2;

        this.zoomFactor = Math.min(Math.max(this.zoomFactor, 0.25), 4);
        this.cursorSize = Math.min(Math.max(this.cursorSize, 7.5/2), 15);

        this.cursor.style.fontSize = this.cursorSize + "px";
    }   
    zoomOut(){
        this.zoomFactor /= 2; 
        this.cursorSize /= 2;

        this.zoomFactor = Math.min(Math.max(this.zoomFactor, 0.25), 4);
        this.cursorSize = Math.min(Math.max(this.cursorSize, 7.5/2), 15);

        this.cursor.style.fontSize = this.cursorSize + "px";
    }
    renderMouse(e){
        const rect = this.canvasRect();
        this.mouse.sx = e.clientX - rect.left;
        this.mouse.sy = e.clientY - rect.top;
        this.cursor.style.left = e.pageX + "px";
        this.cursor.style.top = e.pageY + "px";
    }
    reduceHealth(){
        this.hp--;
        if(this.hp > 0) healthBarsHTML[this.hp].style.opacity = 0.5;
        this.flash("255,255,255", 100)
    }
    addHealth(){
        if(this.hp < 5) healthBarsHTML[this.hp].style.opacity = 1;
        this.hp++;
    }
    die(){
        world.paused = true;
        this.dead = true;
        enemy.pauseResume();
        asteroid.pauseResume();
        this.pauseResume();

        gameStatsHTML.style.display = "none";
        homeButtonImgHTML.src = "assets/purple-home-icon.png";
        homeButtonHTML.style.display = "block";


        world.particleBlast(1000, this.x, this.y, this.color, 10);

        setTimeout(() => {
            world.displayCanvasMessage("You Died", "rgba(153,0,204,1)")
            cancelAnimationFrame(world.animationId);
        }, 1000)
    }
    lose(){
            setTimeout(() => {
                gameStatsHTML.style.display = "none";
                homeButtonImgHTML.src = "assets/purple-home-icon.png";
                homeButtonHTML.style.display = "block";

                document.querySelector(".home-screen div").style.display = "flex"

                world.displayCanvasMessage("You Lose", "rgba(153,0,204,1)")

                
                c.lineWidth = 0.3;

                c.font = "25px Arial";
                c.strokeStyle = "rgba(0,255,255,1)";
                c.strokeText(`${((world.friendlySquares / world.totalSquares) * 100).toFixed(1)}%`, 30, 150);

                c.font = "25px Arial";
                c.strokeStyle = "rgba(153,0,204,1)";
                c.strokeText(`${((world.enemySquares / world.totalSquares) * 100).toFixed(1)}%`, 280, 150);
                
                cancelAnimationFrame(world.animationId);
            }, 500)
    }
    win(){
            setTimeout(() => {
                gameStatsHTML.style.display = "none";
                homeButtonImgHTML.src = "assets/cyan-home-icon.png";
                homeButtonHTML.style.display = "block";

                document.querySelector(".home-screen div").style.display = "flex"

                world.displayCanvasMessage("You Win", "rgba(0,255,255,1)")

                c.lineWidth = 0.3;

                c.font = "25px Arial";
                c.strokeStyle = "rgba(0,255,255,1)";
                c.strokeText(`${((world.friendlySquares / world.totalSquares) * 100).toFixed(1)}%`, 30, 150);

                c.font = "25px Arial";
                c.strokeStyle = "rgba(153,0,204,1)";
                c.strokeText(`${((world.enemySquares / world.totalSquares) * 100).toFixed(1)}%`, 280, 150);
                
                cancelAnimationFrame(world.animationId);
            }, 500)
    }
    goHome(){
        location.reload();
    }
    blast(){
        if(this.energy >= 20 && !this.recharging){
            for (let i = 0; i < this.projectilesPerBlast; i++) {
                const angle = (i / this.projectilesPerBlast) * Math.PI * 2; 
                const v = {
                    x: Math.cos(angle) * this.projectileStats.speed,
                    y: Math.sin(angle) * this.projectileStats.speed
                };
                new Player.Projectile(this, this.x, this.y, v);
            }
            this.energy -= 20;
        }
    }
    handleShooting(){
        const now = Date.now();
        if (
            this.mouseHeld && 
            now - this.lastShotTime > this.shootCooldown && 
            this.energy > 0 && 
            !this.recharging

        ){
            const mouseCoor = this.screenToWorld(this.mouse.sx, this.mouse.sy); 
            const angle = Math.atan2(mouseCoor.y - this.y, mouseCoor.x - this.x);
            const v = { 
                x: Math.cos(angle) * this.projectileStats.speed, 
                y: Math.sin(angle) * this.projectileStats.speed 
            };
            const x = this.x + Math.cos(angle) * (this.radius + this.projectileStats.radius);
            const y = this.y + Math.sin(angle) * (this.radius + this.projectileStats.radius);

            new Player.Projectile(this, x, y, v);

            this.lastShotTime = now;
            this.energy--;
        };

        if(this.energy < 1) {
            this.recharging = true;
        };
        if(this.recharging){
            if(this.energy < this.maxEnergy){
                this.energy += this.rechargeStep;
            } else if(this.energy >= this.maxEnergy){
                this.recharging = false;
            }
        }
        if(this.energy < this.maxEnergy){
            this.energy += 0.02
        }
        this.energyBarHTML.style.width = this.energy * 5.5 + "px";
        if(this.enActivated){
            if(this.energy < this.maxEnergy){
                this.energy += 0.5;
            }
            this.energyBarHTML.style.width =  220 + "px";
            this.shootCooldown = 50;
        } else this.shootCooldown = 150;
        
    }
    launchEntity(){
        const worldPos = this.screenToWorld(this.mouse.sx, this.mouse.sy);
        if( 
            worldPos.x <= world.width && worldPos.x >= 0 && 
            worldPos.y <= world.height && worldPos.y >= 0 
        ){
            if(this.spawnerForSale && this.coins >= this.spawnerPrice){
                new Player.Spawner(this, worldPos.x, worldPos.y)
                this.coins -= this.spawnerPrice;
                this.spawnerPrice += Math.ceil(Math.random() * 7);
            } else if(this.towerForSale && this.coins >= this.towerPrice){
                new Player.DefendTower(this, worldPos.x, worldPos.y)
                this.coins -= this.towerPrice;
                this.towerPrice += Math.ceil(Math.random() * 7);
            }
        }
    }
    resolveAllyCollision(){
        for (let i = 0; i < this.allies.length; i++) {
            for (let j = i + 1; j < this.allies.length; j++) {
                const a = this.allies[i];
                const b = this.allies[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                const minDist = a.radius + b.radius + Math.random() * 30;

                if (dist < minDist) {
                    const overlap = minDist - dist;

                    const nx = dx / dist;
                    const ny = dy / dist;

                    a.x -= nx * overlap / 2;
                    a.y -= ny * overlap / 2;
                    b.x += nx * overlap / 2;
                    b.y += ny * overlap / 2;
                }
            }
        }
    }
    collectiblesScan(){
        for(let i = 0; i < world.collectibles.length; i++){
            const col = world.collectibles[i]
            const dx = this.x - col.x;
            const dy = this.y - col.y;
            const distance = Math.hypot(dx, dy);
            if(distance - this.radius - col.radius < 1){
                if(col.type === "hp" && this.hp < 5){
                    this.addHealth();
                    col.remove();
                } else if(col.type === "en"){
                    col.applyEnEffect(this);
                    col.remove();
                    this.flash("0,255,255", 200);
                    messageLogAnimation("Infinite Energy", "rgb(0,255,255)", 3);
                }
            }
        }
    }

    screenToWorld(sx, sy){
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        return {
            x: this.camera.x + (sx - cx) / this.zoomFactor + cx,
            y: this.camera.y + (sy - cy) / this.zoomFactor + cy
        };
    }
    worldToScreen(wx, wy){
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        return {
            x: ((wx - this.camera.x) - cx) * this.zoomFactor + cx,
            y: ((wy - this.camera.y) - cy) * this.zoomFactor + cy
        };
    }

    static Camera = class {
        constructor(owner){
            this.owner = owner;
            this.x = 0;
            this.y = 0;
            this.cameraDimensions = { width: 0, height: 0 };
        }
        update(){
            const p = this.owner;
            const left = this.x + (canvas.width / 2 -  this.cameraDimensions.width / 2);
            const right = this.x + (canvas.width / 2 +  this.cameraDimensions.width / 2);
            const top = this.y + (canvas.height / 2 -  this.cameraDimensions.height / 2);
            const bottom = this.y + (canvas.height / 2 +  this.cameraDimensions.height / 2);

            if (p.x < left)   this.x -= (left - p.x);
            if (p.x > right)  this.x += (p.x - right);
            if (p.y < top)    this.y -= (top - p.y);
            if (p.y > bottom) this.y += (p.y - bottom);
        }
    }
    static Laser = class {
        constructor(owner){
            this.owner = owner;
        }

        update(){
            const p = this.owner;
            const mw = this.owner.screenToWorld(this.owner.mouse.sx, this.owner.mouse.sy);
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(p.x - p.camera.x, p.y - p.camera.y);
            c.lineTo(mw.x - p.camera.x, mw.y - p.camera.y);

            c.strokeStyle = this.owner.laserColor;
            c.stroke();
        }
    }
    static Projectile = class {
        constructor(owner, x, y, v){
            this.owner = owner;

            this.x = x;
            this.y = y;
            this.v = v;

            this.radius = owner.projectileStats.radius;
            this.color =  owner.projectileStats.color;

            this.id = world.projectileId++;
            this.spawnTime = Date.now();
            this.lifeDuration = owner.projectileStats.lifeDuration

            this.targets = [];

            this.owner.projectiles.push(this); 
        }
        remove(){
            const index = this.owner.projectiles.indexOf(this);
            if (index !== -1) {
                this.owner.projectiles.splice(index, 1)
            }
        }
        update(){
            this.x += this.v.x;
            this.y += this.v.y;

            const now = Date.now();
            if(now - this.spawnTime > this.lifeDuration) {
                this.remove();
            }

            this.handleCollision();
        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
        }
        handleCollision(){
        
            this.owner.projectileTargets = [
                { type: "spawner", array: enemy.spawners },
                { type: "enemy", array: enemy.enemies }
            ];
    
            this.owner.projectileTargets.forEach((group) => { 
                for (let i = group.array.length - 1; i >= 0; i--) {
                    const target = group.array[i];
                    const dx = this.x - target.x;
                    const dy = this.y - target.y;
                    const distance = Math.hypot(dx, dy);
                    const collisionDistance = this.radius + target.radius;
                    if (distance < collisionDistance) {
                        if (group.type === "spawner") {
                            const spawnerCollisionDistance = this.radius + target.radius + target.spread;
                            if (distance < spawnerCollisionDistance) {
                                target.hp--;
                                world.particleBlast(30, this.x, this.y, target.color, 3);
                                this.remove();
                                this.owner.coins++;
                                break; 
                            }
                        } else if (group.type === "enemy") {
                            if(target.radius - 10 > 20) target.reduceRadius();
                            else target.remove();

                            world.particleBlast(30, this.x, this.y, target.color, 3);
                            this.remove();
                            this.owner.coins++;
                            break; 
                        }
                    }
                }
            })
        }
    }
    static Spawner = class {
        constructor(owner, x, y){
            this.owner = owner

            this.x = x;
            this.y = y

            this.color = owner.color;

            this.radius = 30;
            this.spread = 30;
            
            this.hp = 10;

            this.id = owner.spawnerId++; 

            this.contaminationRadius = 0;
            this.spawnTick = Date.now();

            this.spawnRate = this.owner.spawnRate;
            this.numberPerSpawn = 1;
            this.lastSpawn = Date.now();

            this.mapRadius = 3;
            this.mapColor = "rgb(0,255,255)"

            this.owner.spawners.push(this)
            map.objects.push(this);
        }
        draw(camera){
            c.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                c.beginPath();
                c.arc(
                    this.x + getRandomSign() * Math.random() * 30 - camera.x,
                    this.y + getRandomSign() * Math.random() * 30 - camera.y,
                    this.radius * 0.5 + Math.random() * (this.radius * 0.5),
                    0, Math.PI * 2
                );
                c.fillStyle = this.color;
                c.strokeStyle = "black";
                c.stroke();
                c.fill();
            }
        }
        update(){
            this.spawnRate = this.owner.spawnRate;

            this.contaminateArea();

            if(this.hp < 1){
                this.remove();
            }

            const now = Date.now()
            if(now - this.lastSpawn > this.spawnRate){
                for(let i = 0; i < this.numberPerSpawn; i++){
                    this.spawn();
                }
                this.lastSpawn = now;
            }
        }
        contaminateArea() {
            const cols = world.grid[0].length;
            const rows = world.grid.length;

            this.contaminationRadius += 0.4;

            const minX = Math.max(0, Math.floor((this.x - this.contaminationRadius) / world.squareSize));
            const maxX = Math.min(cols - 1, Math.ceil((this.x + this.contaminationRadius) / world.squareSize));
            const minY = Math.max(0, Math.floor((this.y - this.contaminationRadius) / world.squareSize));
            const maxY = Math.min(rows - 1, Math.ceil((this.y + this.contaminationRadius) / world.squareSize));

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const squareCenterX = x * world.squareSize + world.squareSize / 2;
                    const squareCenterY = y * world.squareSize + world.squareSize / 2;
                    const dx = this.x - squareCenterX;
                    const dy = this.y - squareCenterY;
                    const dist = Math.hypot(dx, dy);

                    if (dist < this.contaminationRadius) {
                        const cell = world.grid[y][x];
                        const key = `friendly-${this.id}`;

                        if (cell.type === null) {
                            cell.contaminatedBy = new Set([key]);
                            cell.type = "friendly";
                            cell.ownerSpawnTick = this.spawnTick;
                            cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                        } else if (cell.type === "friendly") {
                            cell.contaminatedBy.add(key);
                            cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                        } else {
                            if (this.spawnTick > (cell.ownerSpawnTick || 0)) {
                                cell.contaminatedBy = new Set([key]);
                                cell.type = "friendly";
                                cell.ownerSpawnTick = this.spawnTick;
                                cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                            }
                        }
                    }
                }
            }
        }
        spawn(){
            new Player.Ally(this.owner, this.x, this.y);
        }
        remove(){
            const index = this.owner.spawners.indexOf(this);
            const mapIndex = map.objects.indexOf(this);
            if (index !== -1 && mapIndex !== -1){
                this.owner.spawners.splice(index, 1);
                map.objects.splice(mapIndex, 1)
            } 

            for (let y = 0; y < world.grid.length; y++) {
                for (let x = 0; x < world.grid[y].length; x++) {
                    const cell = world.grid[y][x];
                    const key = `${"friendly"}-${this.id}`;

                    if (cell.contaminatedBy.has(key)) {
                        cell.contaminatedBy.delete(key);

                        if (cell.contaminatedBy.size === 0) {
                            cell.type = null;
                            cell.contaminationLevel = 0;
                        } else {
                            cell.type = "friendly";
                        }
                    }
                }
            }

            world.particleBlast(1000, this.x, this.y, this.color, 8);
        }
    }
    static Ally = class {
        constructor(owner, x, y){
            this.owner = owner;

            this.x = x;
            this.y = y;
            this.v = {
                x: Math.cos(Math.random() * Math.PI * 2) * Math.random(),
                y: Math.sin(Math.random() * Math.PI * 2) * Math.random()
            }

            this.radius = player.radius + 10;
            this.color = player.color;

            this.spawnTime = Date.now();
            this.oneDirectionDuration = 5000;
            
            this.projectileSpeed = this.owner.projectileStats.speed;
            this.shootInterval = this.owner.allyShootInterval;
            this.lastShot = 0;

            this.mapRadius = 1;
            this.mapColor = this.color;

            this.owner.allies.push(this);
            map.objects.push(this);

            
        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
        }
        update() {
            this.shootInterval = this.owner.allyShootInterval
            const now = Date.now();
            let closestDistance = Infinity;

            // find targets
            let target = null;

            const targets = [...enemy.enemies, ...enemy.spawners]

            // find closest target
            for (let i = 0; i < targets.length; i++){
                const dx = this.x - targets[i].x;
                const dy = this.y - targets[i].y;
                const distance = Math.hypot(dx, dy);

                if (distance < closestDistance){
                    closestDistance = distance;
                    target = targets[i];
                }
            }

            // behavior
            if (closestDistance <= 500 && target){
                this.v.x = 0;
                this.v.y = 0;
                if(now - this.lastShot > this.shootInterval){
                    this.shoot(target, now);
                }
            } else if (closestDistance < 1500){
                const angle = Math.atan2(
                    target.y - this.y,
                    target.x - this.x
                );
                const speed = 5 + Math.random();
                this.v.x = Math.cos(angle) * speed;
                this.v.y = Math.sin(angle) * speed;
            } else {
                const distanceToOwner = Math.hypot(this.x - this.owner.x, this.y - this.owner.y)
                if(distanceToOwner < 500 && distanceToOwner > 100){
                    const angle = Math.atan2(
                        this.owner.y - this.y,
                        this.owner.x - this.x
                    );
                    const speed = 15 + Math.random();
                    this.v.x = Math.cos(angle) * speed;
                    this.v.y = Math.sin(angle) * speed;
                } else if (now - this.spawnTime > this.oneDirectionDuration){
                    this.v.x = Math.cos(Math.random() * Math.PI * 2) * Math.random();
                    this.v.y = Math.sin(Math.random() * Math.PI * 2) * Math.random();
                    this.spawnTime = now;
                }
            }

            // apply velocity
            this.x += this.v.x;
            this.y += this.v.y;

            // clamp to world
            this.x = Math.max(this.radius, Math.min(this.x, world.width - this.radius));
            this.y = Math.max(this.radius, Math.min(this.y, world.height - this.radius));
        }
        shoot(target, now){
            const angle = Math.atan2(
                target.y - this.y,
                target.x - this.x
            );
            const v = {
                x: Math.cos(angle) * this.projectileSpeed,
                y: Math.sin(angle) * this.projectileSpeed
            };
            new Player.Projectile(this.owner, this.x, this.y, v);
            this.lastShot = now;
        }
        remove(){
            const index = this.owner.allies.indexOf(this);
            const mapIndex = map.objects.indexOf(this);
            if (index !== -1 && mapIndex !== -1){
                this.owner.allies.splice(index, 1);
                map.objects.splice(mapIndex, 1)
            } 
        }
    }
    static DefendTower = class {
        constructor(owner, x, y) {
        this.owner = owner;

        this.x = x;
        this.y = y;

        this.radius = 25;
        this.color = this.owner.color;
        this.laser = new Player.DefendTower.Laser(this, this.x, this.y);

        this.circles = [];
        this.hp = 5;

        this.mapRadius = 3;
        this.mapColor = "white";

        const directions = [
            { dx: +1, dy: -1 },
            { dx: -1, dy: -1 },
            { dx: -1, dy: +1 },
            { dx: +1, dy: +1 },
            { dx: +1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: +1 }
        ];

        for (const dir of directions) {
            const spread = 20 + Math.random() * 10;
            const radius = this.radius + Math.random() * 3;
            const change = 0.3 + Math.random() * 0.7;

            this.circles.push({
                dx: dir.dx,
                dy: dir.dy,
                spread,
                minSpread: spread * 0.8,
                maxSpread: spread * 1.2,
                radius,
                minRadius: radius * 0.9,
                maxRadius: radius * 1.1,
                growing: Math.random() > 0.5,
                change
            });
        }

        this.owner.towers.push(this);
        map.objects.push(this);
        }
        draw(camera) {
            this.laser.draw(camera)
            c.fillStyle = this.color;
            c.strokeStyle = "black";

            for (const circle of this.circles) {
                const cx = this.x + circle.dx * circle.spread - camera.x;
                const cy = this.y + circle.dy * circle.spread - camera.y;

                c.beginPath();
                c.arc(cx, cy, circle.radius, 0, Math.PI * 2);
                c.stroke();
                c.fill();
            }
        }
        update() {
            for (const circle of this.circles) {
                if (circle.growing) {
                    circle.spread += circle.change;
                    circle.radius += circle.change * 0.5;

                    if (circle.spread >= circle.maxSpread) {
                    circle.spread = circle.maxSpread;
                    circle.growing = false;
                    }
                } else {
                    circle.spread -= circle.change;
                    circle.radius -= circle.change * 0.5;

                    if (circle.spread <= circle.minSpread) {
                    circle.spread = circle.minSpread;
                    circle.growing = true;
                    }
                }
            }
            if(this.hp < 1){
                this.remove();
            }

            this.laser.update();
        }
        remove(){
            const index = this.owner.towers.indexOf(this);
            const mapIndex = map.objects.indexOf(this);
            if (index !== -1 && mapIndex !== -1){
                this.owner.towers.splice(index, 1);
                map.objects.splice(mapIndex, 1)
            } 
            world.particleBlast(1000, this.x, this.y, this.color, 8);
        }
        static Laser = class {
            constructor(owner, xStart, yStart) {
                this.owner = owner;

                this.xStart = xStart;
                this.yStart = yStart;

                this.color = "rgb(0, 255, 255)";
                this.width = 2;
                this.radius = 500;

                this.angle = 0;
                this.rotationSpeed = 0.05;

                this.xEnd = this.xStart + Math.cos(this.angle) * this.radius;
                this.yEnd = this.yStart + Math.sin(this.angle) * this.radius;

                // Array to store burn marks
                this.burnTrail = [];
                this.maxTrailLength = 100; // how long the burn remains

                this.targets = [];
            }

            draw(camera) {
                // Draw burn marks
                for (let i = 0; i < this.burnTrail.length; i++) {
                    const mark = this.burnTrail[i];
                    c.beginPath();
                    c.fillStyle = `rgba(0, 255, 255, ${mark.alpha})`; // fading alpha
                    c.arc(mark.x - camera.x, mark.y - camera.y, 3, 0, Math.PI * 2);
                    c.fill();
                }

                // Draw main laser
                c.lineWidth = this.width;
                c.strokeStyle = this.color;
                c.beginPath();
                c.moveTo(this.xStart - camera.x, this.yStart - camera.y);
                c.lineTo(this.xEnd - camera.x, this.yEnd - camera.y);
                c.stroke();
            }

            update() {
                // Clockwise rotation
                this.angle += this.rotationSpeed;

                // Update laser endpoint
                this.xEnd = this.xStart + Math.cos(this.angle) * this.radius;
                this.yEnd = this.yStart + Math.sin(this.angle) * this.radius;

                // Add burn mark at the end of the laser
                this.burnTrail.push({
                    x: this.xEnd,
                    y: this.yEnd,
                    alpha: 0.6, // initial opacity
                });

                // Fade out old marks
                for (let mark of this.burnTrail) {
                    mark.alpha -= 0.01; // controls fade speed
                }

                // Remove fully faded marks
                this.burnTrail = this.burnTrail.filter(mark => mark.alpha > 0);
                this.handleCollision()
            }

            handleCollision() {
                this.targets = [
                    { type: "enemy", array: enemy.enemies },
                    { type: "projectile", array: [...enemy.projectiles, ...asteroid.projectiles] },
                ];

                this.targets.forEach(group => {
                    for (let i = group.array.length - 1; i >= 0; i--) {
                        const target = group.array[i];
                        const tx = target.x;
                        const ty = target.y;
                        const tr = target.radius; 

                        const dist = this.distancePointToLineSegment(tx, ty, this.xStart, this.yStart, this.xEnd, this.yEnd);

                        if (dist < tr) {
                            if (group.type === "enemy") {
                                target.remove();
                                world.particleBlast(30, target.x, target.y, this.color, 3);
                                player.coins++;
                            } else if (group.type === "projectile") {
                                target.remove();
                                world.particleBlast(30, target.x, target.y, this.color, 3);
                            }
                        }
                    }
                });
            }

            distancePointToLineSegment(px, py, x1, y1, x2, y2) {
                const A = px - x1;
                const B = py - y1;
                const C = x2 - x1;
                const D = y2 - y1;

                const dot = A * C + B * D;
                const lenSq = C * C + D * D;
                let param = -1;
                if (lenSq !== 0) param = dot / lenSq;

                let xx, yy;
                if (param < 0) {
                    xx = x1;
                    yy = y1;
                } else if (param > 1) {
                    xx = x2;
                    yy = y2;
                } else {
                    xx = x1 + param * C;
                    yy = y1 + param * D;
                }

                const dx = px - xx;
                const dy = py - yy;
                return Math.sqrt(dx * dx + dy * dy);
            }

        }
    };
}