class HomeScreenAnimation {
    constructor(){
        this.animationId;
        this.player = {
            x: canvas.width / 2,
            y: canvas.height / 2
        }
        this.mouse = {
            x: undefined,
            y: undefined        
        }
        this.cursor =  document.querySelector(".custom-cursor");
        document.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect(); // get canvas position and size
            this.mouse = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.cursor.style.left = e.pageX + "px";
            this.cursor.style.top = e.pageY + "px";
        });

        this.squareSize = 50;
        this.grid = [];

        this.initGrid()
    }
    initGrid() {
        const cols = Math.ceil(canvas.width / this.squareSize);
        const rows = Math.ceil(canvas.height / this.squareSize);

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
      drawGrid() {
        const cols = this.grid[0].length;
        const rows = this.grid.length;

        const playerGridX = Math.floor(this.player.x / this.squareSize);
        const playerGridY = Math.floor(this.player.y / this.squareSize);

        
        let rad = canvas.width;
        const renderRadius = Math.ceil(rad / this.squareSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {

                if (
                    Math.abs(x - playerGridX) <= renderRadius &&
                    Math.abs(y - playerGridY) <= renderRadius
                ) {
                    const xPos = x * this.squareSize;
                    const yPos = y * this.squareSize;

                    c.beginPath();
                    c.rect(xPos, yPos, this.squareSize, this.squareSize);

                    c.strokeStyle = "rgba(255,255,255,0.05)";
                    
                    c.stroke();
                }
            }
        }
    }
    drawPlayer(){
        c.beginPath();
        c.arc(this.player.x, this.player.y, 15, 0, Math.PI * 2, false);
        c.fillStyle = "white";
        c.fill();
    }
    drawLaser(){
        const p = this.player;

        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(this.mouse.x, this.mouse.y);

        c.strokeStyle = "rgba(0,255,255,0.5)";
        c.stroke();
    }
    animate(){
        const self = this
        this.animationId = setInterval(() => {
            c.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
            c.fillRect(0, 0, canvas.width, canvas.height);

            self.drawGrid();
            self.drawLaser();
            self.drawPlayer();
        }, 16)
    }
}