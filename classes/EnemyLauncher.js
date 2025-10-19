class EnemyLauncher {
    constructor(){
        this.color = "rgb(153,0,204)";
        this.gridColor = "153,0,204"
        this.evilGridColor = "0,0,255"

        this.launchRate = 8000;
        this.lastLaunch = Date.now();

        this.spawners = [];
        this.spawnerId = -1;

        this.enemies = [];
        this.enemyId = -1;

        this.projectiles = [];


        this.crazyHuntDuration = 5000;
        this.crazyHuntBreak = 40000;
        this.lastCrazuHunt = Date.now();
        this.crazyHuntMode = false;

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

            this.lastLaunch += delta;
            this.lastCrazuHunt += delta;

            this.spawners.forEach(s => s.lastSpawn += delta);
        }
    }
    update(camera){
        if (this.paused) return;

        const now = Date.now();
        const timeSinceLast = now - this.lastCrazuHunt;

        if (timeSinceLast < this.crazyHuntDuration) this.crazyHuntMode = true;
         else if (timeSinceLast >= this.crazyHuntBreak) {
            this.lastCrazuHunt = now;
            this.crazyHuntMode = true;
        } else this.crazyHuntMode = false;

        this.spawners.forEach((s) => {
            s.draw(camera);
            s.update();
        })

        this.enemies.forEach((e) => {
            e.draw(camera);
            e.update();
        })

        this.projectiles.forEach((p) => {
            p.draw(camera);
            p.update();
        })

        this.resolveCollision()
        this.avoidSpawners();

        if(now - this.lastLaunch > this.launchRate){
            this.launch();
            this.lastLaunch = now;
        }

        this.launchRate -= 0.2;
        if(this.spawners > 10 && world.secondPhase) this.launchRate = 8000;

    }
    launch(){
        if(!world.thirdPhase){
            new EnemyLauncher.Spawner(
                this,
                100 + Math.random() * (world.width - 100),
                100 + Math.random() * (world.height - 100)
            )
        } else {
            const n = Math.random();
            if(n > 0.5){
                new EnemyLauncher.EvilSpawner(
                    this,
                    100 + Math.random() * (world.width - 100),
                    100 + Math.random() * (world.height - 100)
                )
            } else {
                new EnemyLauncher.Spawner(
                    this,
                    100 + Math.random() * (world.width - 100),
                    100 + Math.random() * (world.height - 100)
                )
            }
        }
    }
    resolveCollision(){
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const a = this.enemies[i];
                const b = this.enemies[j];

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
    avoidSpawners() {
        const buffer = 20; 
        for (let i = 0; i < this.spawners.length; i++) {
            for (let j = 0; j < this.enemies.length; j++) {
                const dx = this.enemies[j].x - this.spawners[i].x;
                const dy = this.enemies[j].y - this.spawners[i].y;
                const distance = Math.hypot(dx, dy);

                const minDist = this.spawners[i].radius + this.enemies[j].radius + buffer;

                if (distance < minDist && distance > 0) {
                    const nx = dx / distance;
                    const ny = dy / distance;

                    const overlap = minDist - distance;
                    this.enemies[j].x += nx * overlap;
                    this.enemies[j].y += ny * overlap;

                    this.enemies[j].v.x += nx * 0.5;
                    this.enemies[j].v.y += ny * 0.5;
                }
            }
        }
    }

    static Spawner = class {
        constructor(owner, x, y){
            this.owner = owner;

            this.x = x;
            this.y = y
           
            this.color = this.owner.color;


            this.factor = 1 + Math.random();

            this.radius = 30 * this.factor;
            this.spread = 30 * this.factor
            
            this.hp = 15;

            this.id = owner.spawnerId++; 

            this.contaminationRadius = 0;
            this.spawnTick = Date.now();

            this.spawnRate = 10000;
            this.numberPerSpawn = 3;
            this.lastSpawn = Date.now();

            owner.spawners.push(this)

            this.mapRadius = 3;

            this.mapColor = this.color;

            for(let i = 0; i < this.numberPerSpawn; i++){
                this.spawn();
            }


            map.objects.push(this);
        }
        draw(camera){
            const circles = 10 * this.factor;
            for (let i = 0; i < circles; i++) {
                c.beginPath();
                c.arc(
                    this.x + getRandomSign() * Math.random() * this.spread - camera.x,
                    this.y + getRandomSign() * Math.random() * this.spread - camera.y,
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
            this.contaminateArea();

            if(this.owner.crazyHuntMode){
            this.color = "rgb(255,0,0)"
            this.mapColor = "rgb(255,0,0)";
            this.owner.gridColor = "255,0,0"
            } else {
                this.color = this.owner.color;
                this.mapColor = this.owner.color;
                this.owner.gridColor = "153,0,204"
            }
            
            
            if(this.hp < 1) {
                this.remove();
            }

            let closestDistance = Infinity;
            const targets = [player, ...player.allies, ...player.spawners]; 
            targets.forEach(target => {
                const dx = this.x - target.x;
                const dy = this.y - target.y;
                const distance = Math.hypot(dx, dy);
                if (distance < closestDistance){
                    closestDistance = distance;
                }
            });
            if(closestDistance < 700){
                if(this.owner.enemies.length <= 100){
                    const n = Math.random();

                    if(n <= 0.5) {
                        this.numberPerSpawn = 4;
                    } else if(n > 0.5 && n < 0.7) {
                        this.numberPerSpawn = 5;
                    } else {
                        this.numberPerSpawn = 3;
                    }
                    
                } else this.numberPerSpawn = 0;
            } else {
                const n = Math.random();

                if(n < 0.5) this.numberPerSpawn = 0;

                else this.numberPerSpawn = 1;
            }

            const now = Date.now()
            if(now - this.lastSpawn > this.spawnRate){
                for(let i = 0; i < this.numberPerSpawn; i++){
                    this.spawn();
                }
                this.lastSpawn = now;
            }
        }
        remove(){
            const index = this.owner.spawners.indexOf(this);
            const mapIndex = map.objects.indexOf(this)
            if (index !== -1 && mapIndex !== -1){
                this.owner.spawners.splice(index, 1);
                map.objects.splice(mapIndex, 1);
            } 


            for (let y = 0; y < world.grid.length; y++) {
                for (let x = 0; x < world.grid[y].length; x++) {
                    const cell = world.grid[y][x];
                    const key = `${"enemy"}-${this.id}`;

                    if (cell.contaminatedBy.has(key)) {
                        cell.contaminatedBy.delete(key);

                        if (cell.contaminatedBy.size === 0) {
                            cell.type = null;
                            cell.contaminationLevel = 0;
                        } else {
                            cell.type = "enemy";
                        }
                    }
                }
            }

            world.particleBlast(1000, this.x, this.y, this.color, 8);
        }
        spawn(){
            let radius = (25 + Math.random() * 10)
            let n = Math.random();
            if(world.secondPhase && n > 0.7) radius = 80 + Math.random() * 10;
            new EnemyLauncher.Enemy(this.owner, this.x, this.y, radius, 1)
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
                        const key = `enemy-${this.id}`;

                        if (cell.type === null) {
                            cell.contaminatedBy = new Set([key]);
                            cell.type = "enemy";
                            cell.ownerSpawnTick = this.spawnTick;
                            cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                        } else if (cell.type === "enemy") {
                            cell.contaminatedBy.add(key);
                            cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                        } else {
                            if (this.spawnTick > (cell.ownerSpawnTick || 0)) {
                                cell.contaminatedBy = new Set([key]);
                                cell.type = "enemy";
                                cell.ownerSpawnTick = this.spawnTick;
                                cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                            }
                        }
                    }
                }
            }
        }
    }
    static Enemy = class {
        constructor(owner, x, y, radius, mapRadius){
            this.owner = owner;

            this.x = x;
            this.y = y;

            const angle = Math.random() * Math.PI * 2
            this.radius = radius;
            this.speed = 70 / this.radius;
            this.v = {
                x:  Math.cos(angle) * this.speed,
                y: Math.sin(angle) * this.speed
            }
            this.color = this.owner.color;
            
            this.id = this.owner.enemyId++;

            this.mode = "spread";  
            this.modeStartTime = Date.now(); 
            this.spreadDuration = 1000 + Math.random() * 1000; 
            this.huntDuration = 5000 + Math.random() * 2000; 

            this.huntRadius = 2000;
            
            this.mapRadius = mapRadius;
            this.mapColor = this.color


            this.owner.enemies.push(this);
            map.objects.push(this);

        }
        switchMode(newMode) {
            this.mode = newMode;
            this.modeStartTime = Date.now();
        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
        }
        update(){
            const now = Date.now();
            if (this.owner.crazyHuntMode){
                this.huntRadius = world.width;
                this.color = "rgb(255,0,0)";
                this.mapColor = "rgb(255,0,0)";
            } else {
                this.huntRadius === 2000
                this.color = this.owner.color;
                this.mapColor = this.owner.color;
            }
            

            let closestDistance = Infinity;
            let target = player; 
            const targets = [player, ...player.allies, ...player.spawners]; 

            targets.forEach(obj => {
                const dx = this.x - obj.x;
                const dy = this.y - obj.y;
                const distance = Math.hypot(dx, dy);
                if (distance < closestDistance){
                    closestDistance = distance;
                    target = obj;
                }
            });

            if (this.mode === "spread" && now - this.modeStartTime > this.spreadDuration) {
                this.switchMode("hunt");
            } else if (this.mode === "hunt" && now - this.modeStartTime > this.huntDuration && !this.owner.crazyHuntMode) {
                this.switchMode("spread");
            
                const angle = Math.random() * Math.PI * 2;
                this.speed = 100 / this.radius;
                this.v.x = Math.cos(angle) * this.speed;
                this.v.y = Math.sin(angle) * this.speed;
            }

            if (this.mode === "spread") {
                this.x += this.v.x;
                this.y += this.v.y;
            } else if (this.mode === "hunt" && closestDistance < this.huntRadius) {
                if(this.owner.crazyHuntMode) this.speed = 400 / this.radius;
                else this.speed = 250 / this.radius;
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                this.v.x = Math.cos(angle) * this.speed;
                this.v.y = Math.sin(angle) * this.speed;

                this.x += this.v.x;
                this.y += this.v.y;
            }

            this.x = Math.max(this.radius, Math.min(this.x, world.width - this.radius));
            this.y = Math.max(this.radius, Math.min(this.y, world.height - this.radius));
        }
        remove(){
            const index = this.owner.enemies.indexOf(this);
            const mapIndex = map.objects.indexOf(this)
            if (index !== -1 && mapIndex !== -1){
                this.owner.enemies.splice(index, 1);
                map.objects.splice(mapIndex, 1);
            } 
        }
        reduceRadius(){
            gsap.to(this, {
                radius: this.radius - 10,
                duration: 1,
                ease: "power4.out"
            })
        }
    }

    static EvilSpawner = class {
        constructor(owner, x, y){
            this.owner = owner;
            this.x = x;
            this.y = y;

            this.color = "rgb(0,0,255)";


            this.factor = 1 + Math.random() / 2;
            this.minFactor = this.factor;
            this.maxFactor = this.factor + this.factor / 2;
            this.growing = false;
            this.change = 0.01 + Math.random() * 0.09

            this.radius = 30 * this.factor;
            this.spread = 30 * this.factor
            
            this.hp = 20;

            this.id = this.owner.spawnerId++; 

            this.contaminationRadius = 0;
            this.spawnTick = Date.now();

            this.spawnRate = 10000;
            this.numberPerSpawn = 2;
            this.lastSpawn = Date.now();

            this.owner.spawners.push(this)

            this.mapRadius = 3;

            this.mapColor = this.color;

            for(let i = 0; i < this.numberPerSpawn; i++){
                this.spawn();
            }

            map.objects.push(this);
        }

        draw(camera){
            const circles = 10 * this.factor;
            for (let i = 0; i < circles; i++) {
                c.beginPath();
                c.arc(
                    this.x + getRandomSign() * Math.random() * this.spread - camera.x,
                    this.y + getRandomSign() * Math.random() * this.spread - camera.y,
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
            this.contaminateArea();
            this.radius = 30 * this.factor;
            this.spread = 30 * this.factor

            if (this.growing) {
                this.factor += this.change;
                if (this.factor >= this.maxFactor) {
                    this.factor = this.maxFactor;
                    this.growing = false;
                }
            } else {
                this.factor -= this.change;
                if (this.factor <= this.minFactor) {
                    this.factor = this.minFactor;
                    this.growing = true;
                }
            }
            
            if(this.hp < 1) {
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
        remove(){
            const index = this.owner.spawners.indexOf(this);
            const mapIndex = map.objects.indexOf(this)
            if (index !== -1 && mapIndex !== -1){
                this.owner.spawners.splice(index, 1);
                map.objects.splice(mapIndex, 1);
            } 


            for (let y = 0; y < world.grid.length; y++) {
                for (let x = 0; x < world.grid[y].length; x++) {
                    const cell = world.grid[y][x];
                    const key = `${"evil-enemy"}-${this.id}`;

                    if (cell.contaminatedBy.has(key)) {
                        cell.contaminatedBy.delete(key);

                        if (cell.contaminatedBy.size === 0) {
                            cell.type = null;
                            cell.contaminationLevel = 0;
                        } else {
                            cell.type = "evil-enemy";
                        }
                    }
                }
            }

            world.particleBlast(1000, this.x, this.y, this.color, 8);
        }
        spawn(){
            new EnemyLauncher.EvilEnemy(this.owner, this.x, this.y);
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
                        const key = `evil-enemy-${this.id}`;

                        if (cell.type === null) {
                            cell.contaminatedBy = new Set([key]);
                            cell.type = "evil-enemy";
                            cell.ownerSpawnTick = this.spawnTick;
                            cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                        } else if (cell.type === "evil-enemy") {
                            cell.contaminatedBy.add(key);
                            cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                        } else {
                            if (this.spawnTick > (cell.ownerSpawnTick || 0)) {
                                cell.contaminatedBy = new Set([key]);
                                cell.type = "evil-enemy";
                                cell.ownerSpawnTick = this.spawnTick;
                                cell.contaminationLevel = Math.min(1, 1 - dist / this.contaminationRadius);
                            }
                        }
                    }
                }
            }
        }
    }
    static EvilEnemy = class {
        constructor(owner, x, y){
            this.owner = owner;

            this.x = x;
            this.y = y;

            this.v = {
                x: Math.cos(Math.random() * Math.PI * 2) * Math.random(),
                y: Math.sin(Math.random() * Math.PI * 2) * Math.random()
            }

            this.radius = 20 + Math.random() * 5;
            this.color = "rgb(0,0,255)";

            this.spawnTime = Date.now();
            this.oneDirectionDuration = 5000;
            
            this.projectileSpeed = 15;
            this.shootInterval = 400;
            this.lastShot = 0;

            this.mapRadius = 1;
            this.mapColor = this.color;

            this.owner.enemies.push(this);
            map.objects.push(this);

        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
        }
        update() {
            const now = Date.now();
            let closestDistance = Infinity;

            // find targets
            let target = null;

            const targets = [...player.allies, ...player.spawners, player]

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
                const angle = Math.atan2(
                    target.y - this.y,
                    target.x - this.x
                );
                const speed = 2 + Math.random();
                this.v.x = Math.cos(angle) * speed;
                this.v.y = Math.sin(angle) * speed;
                if(now - this.lastShot > this.shootInterval){
                    this.shoot(target, now);
                }
            } else if (closestDistance < 1500){
                const angle = Math.atan2(
                    target.y - this.y,
                    target.x - this.x
                );
                const speed = 10 + Math.random();
                this.v.x = Math.cos(angle) * speed;
                this.v.y = Math.sin(angle) * speed;
            } else {
                 if (now - this.spawnTime > this.oneDirectionDuration){
                    this.v.x = Math.cos(Math.random() * Math.PI * 2) * 2 + Math.random();
                    this.v.y = Math.sin(Math.random() * Math.PI * 2) * 2 + Math.random();
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
            new EnemyLauncher.Projectile(this.owner, this.x, this.y, v);
            this.lastShot = now;
        }
        remove(){
            const index = this.owner.enemies.indexOf(this);
            const mapIndex = map.objects.indexOf(this);
            if (index !== -1 && mapIndex !== -1){
                this.owner.enemies.splice(index, 1);
                map.objects.splice(mapIndex, 1)
            } 
        }
    }
    static Projectile = class {
        constructor(owner, x, y, v){
            this.owner = owner;
            
            this.x = x;
            this.y = y;
            this.v = v;

            this.radius = 3;
            this.color = "rgba(0, 0, 255, 1)";

            this.spawnTime = Date.now();
            this.lifeDuration = 5000;

            this.targets = [];

            this.owner.projectiles.push(this)
        }
        remove(){
            const index = this.owner.projectiles.indexOf(this);
            if (index !== -1) {
                this.owner.projectiles.splice(index, 1)
            }
        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
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
        handleCollision(){
            const playerArray = []
            playerArray.push(player)
            this.targets = [
                { type: "spawner", array: player.spawners },
                { type: "ally", array: player.allies },
                { type: "player", array: playerArray}
            ];
    
            this.targets.forEach((group) => { 
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
                                break; 
                            }
                        } else if (group.type === "ally") {
                            target.remove();
                            world.particleBlast(30, this.x, this.y, target.color, 3);
                            this.remove();
                            break; 
                        } else if (group.type === "player"){
                            target.reduceHealth();
                            world.particleBlast(30, this.x, this.y, target.color, 3);
                            this.remove();
                            break; 
                        }
                    }
                }
            })
        }
    }
}