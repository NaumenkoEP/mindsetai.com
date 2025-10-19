// set up the canvas
const canvas = document.querySelector(".game-canvas");
const c = canvas.getContext('2d');
canvas.width = innerHeight;
canvas.height = innerHeight;

const gameStatsHTML = document.querySelector(".game-loop");
const homeScreenHTML = document.querySelector(".home-screen");
const pauseScreenHTML = document.querySelector(".pause-screen");
const homeButtonHTML = document.querySelector(".home-button-container");
const homeButtonImgHTML = document.querySelector(".home-button-container button img");

const controlsPanelImgHTML = document.querySelector(".controls-panel .controls-image");
const controlsPanelHTML = document.querySelector(".controls-panel");
function closeControlsPanel(){
    controlsPanelHTML.style.display = "none";
}
function openControlsPanel(){
    controlsPanelHTML.style.display = "flex";
}

function resizeAdjust(element, direction, dop){
    const margin = (innerWidth - canvas.width) / 2

    if(direction === "left") element.style.left = 20 + dop + margin + "px";
    else if (direction === "right") element.style.right = 20 + dop + margin + "px";
}
resizeAdjust(homeScreenHTML, "left", 10);
resizeAdjust(pauseScreenHTML, "left", 10);
resizeAdjust(pauseScreenHTML, "left", 10);
resizeAdjust(homeButtonHTML, "right", 0);
controlsPanelImgHTML.style.width = canvas.width

let messageLogAnimationInProgress = false;
function messageLogAnimation(text, color, number) {
    if (messageLogAnimationInProgress) return;

    const messageLogHTML = document.querySelector(".message-log");
    messageLogHTML.textContent = text;
    messageLogHTML.style.color = color;

    let count = 0;
    let alpha = 1;
    let alphaDirection = -1;

    messageLogAnimationInProgress = true;

    const interval = setInterval(() => {
        alpha += 0.02 * alphaDirection;

        // Reverse direction when reaching limits
        if (alpha <= 0.1) {
            alpha = 0.1;
            alphaDirection = 1;
        } else if (alpha >= 1) {
            alpha = 1;
            alphaDirection = -1;
            count++;
        }

        messageLogHTML.style.opacity = alpha;

        // Stop when enough pulses are done
        if (count >= number) {
            clearInterval(interval);
            messageLogHTML.textContent = "";
            messageLogAnimationInProgress = false;
        }
    }, 16);
}

function getRandomSign() {
    let n = Math.random()
    if(n < 0.5) return -1 ;
    else return 1;
}

const  healthBarsHTML = [];
function initializeHealth(){
    const healthContainer = document.querySelector(".health-container");

    for(let i = 0; i < player.hp; i++){
        const div = document.createElement("div")
        div.classList.add("health-bar")
        healthContainer.appendChild(div);

        healthBarsHTML.push(div)
    }
}

function getBrowserName() {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) return "Chrome";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";

  return "Unknown";
}
let browserDependentAlpha = 0.1;
if(getBrowserName() === "Safari"){
    browserDependentAlpha = 0.03
}

window.addEventListener('resize', () => {
    resizeAdjust(homeScreenHTML, "left", 10);
    resizeAdjust(pauseScreenHTML, "left", 10);
    resizeAdjust(document.querySelector(".stats"), "left", 0);
    resizeAdjust(document.querySelector(".coins-display"), "right", 0);
    resizeAdjust(document.querySelector(".spawner-display"), "left", 0);
    resizeAdjust(document.querySelector(".message-log"), "right", 0);
    resizeAdjust(homeButtonHTML, "right", 0)
})






let world;
let map;
let input;
let player;
let enemy;
let asteroid;

const homeScreenAnimation = new HomeScreenAnimation();
homeScreenAnimation.animate();

function startGame(){
    clearInterval(homeScreenAnimation.animationId)


    world = new World();
    map = new Map();

    input = new InputManager();

    player = new Player(world.width / 2, world.height / 2, "white");
    initializeHealth();
    enemy = new EnemyLauncher();
    asteroid = new AsteroidLauncher();


    resizeAdjust(document.querySelector(".stats"), "left", 0);
    resizeAdjust(document.querySelector(".coins-display"), "right", 0);
    resizeAdjust(document.querySelector(".spawner-display"), "left", 0);
    resizeAdjust(document.querySelector(".message-log"), "right", 0);

    homeScreenHTML.style.display = "none"
    gameStatsHTML.style.display = "block";

    world.animate();
    map.animate();
}


// ---------- TODOS:

// add dying animation
// add two more entities to buy for each phase

// make the tutorial animation
// add sounds
// make the options page