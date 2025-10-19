class AsteroidLauncher{
    constructor(){
        this.asteroids = [];
        this.projectiles = [];
        this.color = "rgba(255,255,0,1)"

        this.lastLaunch = Date.now();
        this.numberPerLaunch = 1;
        this.awaitTime = 6000; 

        this.projectileTargets = [];

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

        }
    }
    update(camera){
        this.asteroids.forEach((a) => {
            a.draw(camera);
            a.update(camera);
        })
        this.projectiles.forEach((p) => {
            p.draw(camera);
            p.update();
        })

        const now = Date.now();
        if(now - this.lastLaunch > this.awaitTime){
            for(let i = 0; i < this.numberPerLaunch; i++){
                this.launch();
            }
            this.lastLaunch = Date.now();
            this.numberPerLaunch++;
            this.awaitTime = Math.ceil(this.awaitTime *= 0.9);
        }
    }
    launch(){   
        new AsteroidLauncher.Asteroid(this);
        player.flash("255,255,0", 200);
        messageLogAnimation("Asteroids", "rgb(255,255,0)", 3);
    }

    static Asteroid = class {
        constructor(owner){
            this.owner = owner;

            this.spawnSpot = {
                x: 100 + Math.random() * (world.width - 200),
                y: - (500 + Math.random() * 500)
            }
            this.landingSpot = {
                x: 100 + Math.random() * (world.width - 200),
                y: 100 + Math.random() * (world.height - 200)
            }

            this.x = this.spawnSpot.x;
            this.y = this.spawnSpot.y;

            this.radius = 20;
            this.mapRadius = 3;
            this.maxRadius = 60 + Math.random() * 10;
            this.color = this.owner.color;
            this.mapColor = this.color;

            const angle = Math.atan2(
                this.landingSpot.y - this.spawnSpot.y,
                this.landingSpot.x - this.spawnSpot.x
            )
            this.speed = 30 + Math.random() * 5;
            this.v = {
                x: Math.cos(angle) * this.speed,
                y: Math.sin(angle) * this.speed
            }

            this.landed = false;

            this.travelDistance = Math.hypot(
                this.spawnSpot.x - this.landingSpot.x,
                this.spawnSpot.y - this.landingSpot.y,

            )
            this.radiusStepFactor = (this.maxRadius - this.radius) / this.travelDistance;
            this.aim = new AsteroidLauncher.Asteroid.Aim(this);

            this.numberPerBlast = 100;

            this.owner.asteroids.push(this);
            map.objects.push(this)
        }
        draw(camera){
            c.beginPath();
            c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);
            c.fillStyle = this.color;
            c.fill();
        }
        update(camera){
            const distance = Math.hypot(this.landingSpot.x - this.x, this.landingSpot.y - this.y);

            if(distance > this.speed){
                this.x += this.v.x;
                this.y += this.v.y;
                this.radius += this.radiusStepFactor * this.speed;
            } else {
                this.x = this.landingSpot.x;
                this.y = this.landingSpot.y;
                this.landed = true;
            }

            if(this.landed){
                this.blast();
                this.remove();
            } else {
                this.aim.draw(camera);
                this.aim.update();
            }
        }
        static Aim = class {
            constructor(owner){
                this.owner = owner;

                this.x = this.owner.landingSpot.x;
                this.y = this.owner.landingSpot.y;
                this.radius = this.owner.radius;
                this.color = this.owner.color;

                this.radiusStepFactor = this.owner.radiusStepFactor;
                this.speed = this.owner.speed
                this.arrowLength = 20;
                map.aims.push(this)
            }
            draw(camera){
                c.beginPath();
                c.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2, false);

                // draw right arrow of the aim
                c.moveTo(this.x + this.radius - this.arrowLength - camera.x, this.y - camera.y);
                c.lineTo(this.x + this.radius + this.arrowLength - camera.x, this.y - camera.y);

                // draw top arrow of the aim
                c.moveTo(this.x - camera.x, this.y - this.radius + this.arrowLength - camera.y);
                c.lineTo(this.x - camera.x, this.y - this.radius - this.arrowLength - camera.y);

                // draw left arrow of the aim
                c.moveTo(this.x - this.radius - this.arrowLength - camera.x, this.y - camera.y);
                c.lineTo(this.x - this.radius + this.arrowLength - camera.x, this.y - camera.y);

                // draw bottom arrow of the aim
                c.moveTo(this.x - camera.x, this.y + this.radius + this.arrowLength - camera.y);
                c.lineTo(this.x - camera.x, this.y + this.radius - this.arrowLength - camera.y);

                c.strokeStyle = this.color;
                c.stroke();
            }
            update(){
                this.radius += this.radiusStepFactor * this.speed;
            }
        }
        remove(){
            const index = this.owner.asteroids.indexOf(this);
            const mapIndex = map.aims.indexOf(this)
            if(index !== -1 && mapIndex !== -1){
                this.owner.asteroids.splice(index, 1);
                map.aims.splice(mapIndex, 1)
            } 
        }
        blast(){
            for(let i = 0; i < this.numberPerBlast; i++){
                new AsteroidLauncher.Projectile(this.owner, this.x, this.y)
            }
        }
        
    }
    static Projectile = class {
        constructor(owner, x, y){
            this.owner = owner;

            this.x = x;
            this.y = y;

            this.color = this.owner.color;
            this.mapColor = this.color;
            this.radius = 5 + Math.random() * 1;
            this.mapRadius = 0.5;
            const angle = Math.random() * Math.PI * 2; 
            const speed = 10 + Math.random() * 2;   
            this.v = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            }
            this.spawnTime = Date.now();
            this.lifeTime = (2 + Math.random() * 2) * 1000;
            this.exploded = false;

            this.owner.projectiles.push(this);
            map.objects.push(this)
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
            if(now - this.spawnTime > this.lifeTime){
                this.remove();
            }

            this.handleCollision();
        }
        remove(){
            const index = this.owner.projectiles.indexOf(this);
            const mapIndex = map.objects.indexOf(this)
            if(index !== -1 && mapIndex !== -1){
                this.owner.projectiles.splice(index, 1);
                map.objects.splice(mapIndex, 1)
            } 
        }
        handleCollision(){
            
            
            this.owner.projectileTargets = [
                { type: "spawner", array: [...enemy.spawners, ...player.spawners] },
                { type: "enemy", array: [...enemy.enemies, ...player.allies] },
                { type: "player", array: player}
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

                                world.particleBlast(30, this.x, this.y, this.color, 3);
                                this.remove();
                            }
                        } else if (group.type === "enemy") {
                            if(target.radius - 10 > 20) target.reduceRadius();
                            else target.remove();

                            world.particleBlast(30, this.x, this.y, this.color, 3);
                            this.remove();
                        } else if (group.type === "player") {
                            target.reduceHealth();

                            world.particleBlast(30, this.x, this.y, this.color, 3);
                            this.remove();
                        }
                    }
                }
            })
        }
    }
}