import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

var player;
var collectibleVal = null;
const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');
let isRedrawing = false;

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function drawStaticElements(players) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "1000 10px 'Press Start 2P', system-ui";
    context.fillStyle = "rgb(242, 75, 75)";
    context.fillText("Controlls : WSAD", 10, 30);
    context.fillText("COIN RACE", 270, 30);
    context.fillText(player.calculateRank(players), 500, 30);
    context.strokeStyle = "red";
    context.strokeRect(5, 50, 630, 425);
    console.log("redrwa");
}

socket.on('client ID', (id) => {
    let xPos = Math.round(getRandomArbitrary(5, 5 + 630 - 40));
    xPos -= xPos % 10;
    let yPos = Math.round(getRandomArbitrary(50, 50 + 425 - 40));
    yPos -= yPos % 10;
    player = new Player({ "x": xPos, "y": yPos, "score": 0, "id": id });
    let img = new Image();
    img.src = '../assets/cropped_image.png';
    img.onload = () => {
        context.drawImage(img, xPos, yPos, 40, 40);
    };
    socket.emit("new player", JSON.stringify(player));
});


socket.on("send changes", ({ players, collectible }) => {
    console.log(players,collectible);
    if (!isRedrawing) {
        isRedrawing = true;
        drawStaticElements(players);
        let loadedCount = 0;
        players.forEach(playerData => {

            if (player.collision(collectible)) {
                player.score += collectible["value"];
                socket.emit("change coordinates", { "player": player, "flag": true });

            }

            if (collectible) {
                collectibleVal = collectible;
                let collectibleImg = new Image();
                collectibleImg.src = collectible["value"] == 1 ? '../assets/coin_coper.png' : collectible["value"] == 2 ? '../assets/coin_silver.png' : '../assets/coin_cold.png';
                collectibleImg.onload = () => {
                    context.drawImage(collectibleImg, collectible.x, collectible.y, 30, 20);
                };
            }


            let playerImg = new Image();
            playerImg.src = playerData.id !== player.id ? '../assets/cropped_image_red.png' : '../assets/cropped_image.png';
            playerImg.onload = () => {
                context.drawImage(playerImg, playerData.x, playerData.y, 40, 40);
                loadedCount++;
                if (loadedCount === players.length) {
                    isRedrawing = false;
                }
            };
        });



    }
});

var pressedKeys = [];

function handleKeyPressed(key) {

    let change = false;
    let { x, y } = player;
    if (pressedKeys["a"] || pressedKeys["A"] || pressedKeys["ArrowLeft"]) {
        change = true;
        player.movePlayer("left", 10);
    }
    if (pressedKeys["w"] || pressedKeys["W"] || pressedKeys["ArrowUp"]) {
        change = true;
        console.log(pressedKeys["a"] || pressedKeys["A"] || pressedKeys["ArrowLeft"]);

        player.movePlayer("up", 10);
    }
    if (pressedKeys["s"] || pressedKeys["S"] || pressedKeys["ArrowDown"]) {
        change = true;
        player.movePlayer("down", 10);
    }
    if (pressedKeys["d"] || pressedKeys["D"] || pressedKeys["ArrowRight"]) {
        change = true;
        player.movePlayer("right", 10);
    }
    if (change && (x != player["x"] || y != player["y"])) {
        if (player.collision(collectibleVal)) {
            player.score += collectibleVal["value"];
            socket.emit("change coordinates", { "player": player, "flag": true });

        } else
            socket.emit("change coordinates", { "player": player, "flag": false });
    }
}


document.addEventListener("DOMContentLoaded", (e) => {
    document.addEventListener("keydown", (e) => {
        pressedKeys[e.key] = true;
        handleKeyPressed(e.key);
    });

    document.addEventListener("keyup", (e) => {
        pressedKeys[e.key] = false;
    })
})



