class Map{
    constructor(){
        this.canvas = document.querySelector(".map-canvas");
        this.c = this.canvas.getContext('2d')

        this.width = 100;
        this.height = 100;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.background = "black"

        this.objects = [];
        this.aims = [];
    }
    worldToMap(worldX, worldY){
        return  {
            x: worldX / (world.width / this.width),
            y: worldY / (world.height / this.height)
        }
    }
    drawObject(object, radius, color){
        const mapCoor = this.worldToMap(object.x, object.y);

        this.c.beginPath();
        this.c.arc(mapCoor.x, mapCoor.y, radius, 0, Math.PI * 2, false);
        this.c.fillStyle = color;
        this.c.fill();
    }
    drawMapGrid() {
        const cols = world.grid[0].length;
        const rows = world.grid.length;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = world.grid[y][x];
                const squareCenterX = x * world.squareSize + world.squareSize / 2;
                const squareCenterY = y * world.squareSize + world.squareSize / 2;

                // map coordinates
                const mapCoords = this.worldToMap(squareCenterX, squareCenterY);
                const mapCellSizeX = world.squareSize / (world.width / this.width);
                const mapCellSizeY = world.squareSize / (world.height / this.height);

                this.c.beginPath();

                if (cell.type === "enemy") {
                    this.c.fillStyle = `rgba(${enemy.gridColor}, ${Math.max(0.2, cell.contaminationLevel)})`;
                } else if (cell.type === "friendly") {
                    this.c.fillStyle = `rgba(0,255,255, ${Math.max(0.2, cell.contaminationLevel)})`;
                } 
                else {
                    this.c.fillStyle = "rgba(255,255,255,0.05)";
                }

                this.c.fillRect(
                    mapCoords.x - mapCellSizeX / 2,
                    mapCoords.y - mapCellSizeY / 2,
                    mapCellSizeX,
                    mapCellSizeY
                );
            }
        }
    }
    drawAim(aim){
        const mapCoor = this.worldToMap(aim.x, aim.y);

        this.c.beginPath();
        this.c.arc(mapCoor.x, mapCoor.y, 2, 0, Math.PI * 2, false);
        this.c.strokeStyle = "rgb(255,255,0)";
        this.c.stroke();
    }

    animate(){
        const self = this;
        setInterval(function(){
            self.c.fillStyle = "rgb(0, 0, 0)";
            self.c.fillRect(0, 0, self.width, self.height);

            self.drawMapGrid();

            self.objects.forEach((obj) => {
                self.drawObject(obj, obj.mapRadius, obj.mapColor)
            })

            self.aims.forEach((a) => {
                self.drawAim(a)
            })
        }, 100)
       
    }
}
