var canvasWidth;
var canvasHeight;
var previousCanvasWidth;
var previousCanvasHeight;

var windowOrientation = window.orientation;

var bucketWidth;
var bucketHeight;

var vanWidth;
var vanHeight;
var charWidth;
var explosionWidth;
var explosionHeight;

var vanDirection = "right";

var playerX = 0;                                // Player's X starting coordinate
var playerY;                                    // Player's Y starting coordinate
var playerDirection = "right";

var vanX = 0;
var vanY;

var fallingChars = [];

var redrawInterval = 30;
var playerSpeed;
var vanSpeed;
var charSpeed;

var charInterval = 3000;
var guessInterval = 150;        // speed that chars are guessed sequentially - higher number makes game harder
var initialGuessDelay = 15000;  // don't guess for this many ms - higher number makes game easier

var playerSpeedBaseline = 1;
var vanSpeedBaseline = 2;
var charSpeedBaseline = 2;

var gameState = "INIT";     // INIT, LEVEL_COMPLETE, RUNNING, PAUSED, OVER, SCORE_SUBMITTED
var gameLevel;
var numLevels = 5;

var tiltHysteresis = 0;

var charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
var guessedChar = 0;
var numGuessedChars = 0;
var passwordLength = 10;
var collectedChars = [];

var score = 0;

var canvas;
var ctx;

var audio = 0;  // 0 mute, 1 sound

var redrawScreenInteral;
var generateCharaterInterval;
var guessCharacterInterval;
var first_guess_timeout;

// Allows multiple sounds to play at same time
var channelMax = 10;
var audioChannels = new Array();
for (a=0; a < channelMax; a++) {
    audioChannels[a] = new Array();
    audioChannels[a]['channel'] = new Audio();
    audioChannels[a]['finished'] = -1;
}

function playSound(s) {

    if (audio == 1) {
        //document.getElementById(s).play();

        for (a=0; a < audioChannels.length; a++) {
            thistime = new Date();
            if (audioChannels[a]['finished'] < thistime.getTime()) {
                audioChannels[a]['finished'] = thistime.getTime() + document.getElementById(s).duration*1000;
                audioChannels[a]['channel'].src = document.getElementById(s).src;
                audioChannels[a]['channel'].load();
                audioChannels[a]['channel'].play();
                break;
            }
        }

    }
}

CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }
};


window.addEventListener("orientationchange", function() {
    windowOrientation = window.orientation;
    $("#debug").html(windowOrientation);
}, false);


function log(message) {
    $("#log").append("<div>" + message + "</div>");
}


function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
    }
    else {
    cancelFullScreen.call(doc);
    }
}

function getPitch() {
    if(window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(event) {
            var alpha = Math.round(event.alpha);
            var beta = Math.round(event.beta);
            var gamma = Math.round(event.gamma);

            if(alpha!=null || beta!=null || gamma!=null) {
                $("#dataContainerOrientation").html('alpha: ' + alpha + '<br/>beta: ' + beta + '<br />gamma: ' + gamma);

                $("#debugPlayerDirection").text(playerDirection);

                if ((windowOrientation == 90 && beta > tiltHysteresis) || (windowOrientation == -90 && beta < -tiltHysteresis) ||
                    (windowOrientation == 0 && gamma > tiltHysteresis)) {
                    playerDirection = "right";
                } else if ((windowOrientation == 90 && beta < -tiltHysteresis) || (windowOrientation == -90 && beta > tiltHysteresis) ||
                    (windowOrientation == 0 && gamma < -tiltHysteresis)) {
                    playerDirection = "left";
                }
            }
          }, false);
  }
}

function getKeystrokes () {

    var key = null;

    $(document).keydown(function(event) {

        if (event.which == 37) {
            key = "left";
            playerDirection = "left";
        } else if (event.which == 39) {
            key = "right";
            playerDirection = "right";
        } else if (event.which == 38) {
            key = "up";
        } else if (event.which == 40) {
            key = "down";
        } else if (event.which == 83) { // s key
            audio = (audio) ? 0 : 1;
        } else if (event.which == 80) { // p key

            if (gameState == "RUNNING") {
                gameState = "PAUSED";
                clearAllIntervals ();
            } else if (gameState == "PAUSED") {
                gameState = "RUNNING";
                startAllIntervals (0);
            }
        }
    });
}



/* ----------- Drawing functions -------------------------------- */

function drawFallingChar(char, x, y) {

    ctx.font = "bold " + charWidth + "px Courier New";
    ctx.fillStyle = "#b3b3b3";
    ctx.fillText(char, x-2, y-2);
    ctx.fillStyle = "#000000";
    ctx.fillText(char, x, y);
}

function drawBucket(x, y) {

    var img = document.getElementById("mineCarImage");
    ctx.drawImage(img, x, y, bucketWidth, bucketHeight);

}

function drawVan(x, y) {

    var vanImg;

    if (vanDirection == "left") {
        vanImg = document.getElementById("vanLeftImage");
    } else {
        vanImg = document.getElementById("vanRightImage");
    }

    ctx.drawImage(vanImg, x, y, vanWidth, vanHeight);
}


function drawExplosion (x, y) {

    var explosionImg;

    explosionImg = document.getElementById("explosionImage");
    ctx.drawImage(explosionImg, x, y, explosionWidth, explosionHeight);
}


function drawCollectedChars () {

    ctx.font = charWidth * 0.75 + "px Courier New";

    ctx.strokeStyle = "#000000";

    for (i = 0; i < passwordLength; i++) {
        ctx.beginPath();
        ctx.moveTo(canvasWidth * 0.311 + i * charWidth * 0.75, canvasHeight * 0.086);
        ctx.lineTo(canvasWidth * 0.311 + i * charWidth * 0.75 + charWidth * 0.5, canvasHeight * 0.086);
        ctx.stroke();
    }

    for (i = 0; i < collectedChars.length; i++) {
        ctx.fillStyle = "#000000";
        ctx.fillText(collectedChars[i], canvasWidth * 0.311 + i * charWidth * 0.75, canvasHeight * 0.074);
        ctx.fillStyle = (i < numGuessedChars) ? "#FF0000" : "#FFFFFF";
        ctx.fillText(collectedChars[i], canvasWidth * 0.312 + i * charWidth * 0.75, canvasHeight * 0.075);
    }

}

function drawGuessedChar () {

    ctx.font = charWidth + "px Courier New";
    ctx.fillStyle = "#000000";
    ctx.fillText(charSet[guessedChar], canvasWidth * 0.085, canvasHeight * 0.07);
    ctx.fillStyle = "#FF0000";
    ctx.fillText(charSet[guessedChar], canvasWidth * 0.086, canvasHeight * 0.071);


}

function drawScore () {

    ctx.font = charWidth * 0.75 + "px Courier New";
    ctx.fillStyle = "#000000";
    ctx.fillText("Player 1", canvasWidth * 0.800, canvasHeight * 0.050);
    ctx.fillText(score, canvasWidth * 0.800, canvasHeight * 0.10);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Player 1", canvasWidth * 0.801, canvasHeight * 0.051);
    ctx.fillText(score, canvasWidth * 0.801, canvasHeight * 0.101);

}

function drawBackground() {

    var grd=ctx.createLinearGradient(0, 0, 0, canvasHeight);
    grd.addColorStop(0,"#99cbff");
    grd.addColorStop(1,"#e5f2ff");
    ctx.fillStyle=grd;
    ctx.fillRect(0,0,canvasWidth,canvasHeight);

    var cloudsImg = document.getElementById("cloudsImage");
    ctx.drawImage(cloudsImg, canvasWidth * 0.1, canvasHeight / 4, canvasWidth/5, canvasHeight/5);
    ctx.drawImage(cloudsImg, canvasWidth * 0.4, canvasHeight / 6, canvasWidth/5, canvasHeight/5);
    ctx.drawImage(cloudsImg, canvasWidth * 0.7, canvasHeight / 3, canvasWidth/5, canvasHeight/5);

    var machineImg = document.getElementById("machineImage");
    ctx.drawImage(machineImg, 0, 0, canvasWidth/5, canvasHeight/5);
    ctx.font = charWidth * 0.33 + "px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("Password", canvasWidth * 0.074, canvasHeight * 0.14);
    ctx.fillText("Cracker", canvasWidth * 0.080, canvasHeight * 0.16);
    ctx.fillText("2000", canvasWidth * 0.085, canvasHeight * 0.18);

    ctx.strokeStyle = "#000000";

    // roof
    ctx.fillStyle = "#ccf3ff";
    ctx.setTransform(1, 0, 0, 1, canvasWidth * 0.51, 0);
    ctx.strokeRect (0, canvasHeight * 0.45, canvasWidth * 0.06, canvasHeight * 0.1);
    ctx.fillRect (0, canvasHeight * 0.45, canvasWidth * 0.06, canvasHeight * 0.1);

    // roof 3d
    ctx.fillStyle = "#b3edff";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.57, 0);
    ctx.strokeRect (0, canvasHeight * 0.45, canvasWidth * 0.06, canvasHeight * 0.1);
    ctx.fillRect (0, canvasHeight * 0.45, canvasWidth * 0.06, canvasHeight * 0.1);

    // main tower
    ctx.fillStyle = "#E5F9FF";
    ctx.setTransform(1, 0, 0, 1, canvasWidth * 0.5, 0);
    ctx.strokeRect (0, canvasHeight * 0.55, canvasWidth * 0.08, canvasHeight * 0.45);
    ctx.fillRect (0, canvasHeight * 0.55, canvasWidth * 0.08, canvasHeight * 0.45);

    // tower 3d
    ctx.fillStyle = "#ccf3ff";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.58, 0);
    ctx.strokeRect (0, canvasHeight * 0.55, canvasWidth * 0.08, canvasHeight * 0.45);
    ctx.fillRect (0, canvasHeight * 0.55, canvasWidth * 0.08, canvasHeight * 0.45);

    // tower inset
    ctx.fillStyle = "#99e7ff";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.585, canvasHeight * 0.04);
    ctx.strokeRect (0, canvasHeight * 0.55, canvasWidth * 0.04, canvasHeight * 0.08);
    ctx.fillRect (0, canvasHeight * 0.55, canvasWidth * 0.04, canvasHeight * 0.08);


    // 1717 Arch
    ctx.fillStyle = "#f2e6d9";
    ctx.setTransform(1, 0, 0, 1, canvasWidth * 0.715, 0);
    ctx.strokeRect (0, canvasHeight * 0.52, canvasWidth * 0.05, canvasHeight * 0.06);
    ctx.fillRect (0, canvasHeight * 0.52, canvasWidth * 0.05, canvasHeight * 0.06);

    ctx.fillStyle = "#ecd9c6";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.765, 0);
    ctx.strokeRect (0, canvasHeight * 0.52, canvasWidth * 0.05, canvasHeight * 0.06);
    ctx.fillRect (0, canvasHeight * 0.52, canvasWidth * 0.05, canvasHeight * 0.06);

    ctx.fillStyle = "#f2e6d9";
    ctx.setTransform(1, 0, 0, 1, canvasWidth * 0.71, 0);
    ctx.strokeRect (0, canvasHeight * 0.58, canvasWidth * 0.06, canvasHeight * 0.06);
    ctx.fillRect (0, canvasHeight * 0.58, canvasWidth * 0.06, canvasHeight * 0.06);

    ctx.fillStyle = "#ecd9c6";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.77, 0);
    ctx.strokeRect (0, canvasHeight * 0.58, canvasWidth * 0.06, canvasHeight * 0.06);
    ctx.fillRect (0, canvasHeight * 0.58, canvasWidth * 0.06, canvasHeight * 0.06);

    ctx.fillStyle = "#f2e6d9";
    ctx.setTransform(1, 0, 0, 1, canvasWidth * 0.705, 0);
    ctx.strokeRect (0, canvasHeight * 0.64, canvasWidth * 0.07, canvasHeight * 0.06);
    ctx.fillRect (0, canvasHeight * 0.64, canvasWidth * 0.07, canvasHeight * 0.06);

    ctx.fillStyle = "#ecd9c6";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.775, 0);
    ctx.strokeRect (0, canvasHeight * 0.64, canvasWidth * 0.07, canvasHeight * 0.06);
    ctx.fillRect (0, canvasHeight * 0.64, canvasWidth * 0.07, canvasHeight * 0.06);

    ctx.fillStyle = "#f2e6d9";
    ctx.setTransform(1, 0, 0, 1, canvasWidth * 0.7, 0);
    ctx.strokeRect (0, canvasHeight * 0.7, canvasWidth * 0.08, canvasHeight * 0.35);
    ctx.fillRect (0, canvasHeight * 0.7, canvasWidth * 0.08, canvasHeight * 0.35);

    ctx.fillStyle = "#ecd9c6";
    ctx.setTransform(0.2, 0.2, 0, 1, canvasWidth * 0.78, 0);
    ctx.strokeRect (0, canvasHeight * 0.7, canvasWidth * 0.08, canvasHeight * 0.35);
    ctx.fillRect (0, canvasHeight * 0.7, canvasWidth * 0.08, canvasHeight * 0.35);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}


function setScale() {
    var scalingFactor = 1;

    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.95;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    if (previousCanvasWidth) {
        scalingFactor = canvasWidth / previousCanvasWidth;
    }

    bucketWidth = Math.round (canvasWidth / 10);
    bucketHeight = Math.round (bucketWidth / 2);

    vanWidth = Math.round (canvasWidth / 7.5);
    vanHeight = Math.round (vanWidth / 2.5);

    explosionWidth = Math.round (canvasWidth / 20);
    explosionHeight = explosionWidth;

    charWidth = Math.round(canvasWidth / 30);

    playerX = Math.floor(playerX * scalingFactor);
    playerY = canvasHeight - bucketHeight;

    vanY = Math.round(canvasHeight / 6);

    playerSpeed = canvasWidth * redrawInterval * playerSpeedBaseline / 10000;
    vanSpeed = canvasWidth * redrawInterval * vanSpeedBaseline / 10000;
    charSpeed = canvasHeight * redrawInterval * charSpeedBaseline / 10000;

    previousCanvasWidth = canvasWidth;
    previousCanvasHeight = canvasHeight;
}


$( window ).resize(function() {

    setScale();
    drawBackground();

    if (gameState == "INIT") {
        drawSplashScreen();
    }

});


function genCharacter () {

    var char = new Object();
    char.value = charSet.charAt(Math.floor(Math.random() * charSet.length));

    if (vanDirection == "right") {
        char.x = vanX - vanWidth * 0.1;
    } else {
        char.x = Math.round(vanX + vanWidth * 0.9);
    }

    if (char.x < 0) {
        char.x = 0;
    } else if (char.x > canvasWidth - charWidth) {
        char.x = canvasWidth - charWidth;
    }

    char.y = Math.round(vanY + vanHeight / 2);
    fallingChars.push (char);
    playSound ("charDropSound");

    generateCharaterInterval = setTimeout(function(){ genCharacter(); }, 200 + Math.floor(Math.random() * charInterval));
}


function startAllIntervals (first_guess_delay) {

    redrawScreenInterval = setInterval(function() {
        redrawScreen(); }, redrawInterval);

    //generateCharaterInterval = setInterval(function() {
    //    genCharacter(); }, charInterval);
    genCharacter ();

    first_guess_timeout = setTimeout (function () {
        guessCharacterInterval = setInterval(function() {
            guessCharacter(); }, guessInterval);
    }, first_guess_delay);

}

function clearAllIntervals () {
    clearInterval (redrawScreenInterval);
    clearInterval (guessCharacterInterval);
    clearInterval (generateCharaterInterval);
    clearTimeout (first_guess_timeout);
}

function showScore () {

    $('#score').html(score);
    $('#score_popup').show(500);
    $('#fade').show(500);
    gameState = "SCORE_SUBMITTED";
}


function gameOver () {

    gameState = "OVER";
    clearAllIntervals ();

    ctx.font = charWidth * 2 + "px Verdana";
    ctx.fillStyle = "#000000";
    ctx.fillText("Game Over", canvasWidth * 0.3, canvasHeight * 0.5);
    ctx.fillStyle = "#FF0000";
    ctx.fillText("Game Over", canvasWidth * 0.302, canvasHeight * 0.502);
}


function levelOver () {

    clearAllIntervals ();

    if (gameLevel < numLevels) {
        gameState = "LEVEL_COMPLETE";

        ctx.font = charWidth * 2 + "px Verdana";
        ctx.fillStyle = "#000000";
        ctx.fillText("Level " + gameLevel + " Complete", canvasWidth * 0.2, canvasHeight * 0.5);
        ctx.fillStyle = "#33cc33";
        ctx.fillText("Level " + gameLevel + " Complete", canvasWidth * 0.202, canvasHeight * 0.502);
        gameLevel ++;
    } else {
        gameState = "OVER";

        ctx.font = charWidth * 2 + "px Verdana";
        ctx.fillStyle = "#000000";
        ctx.fillText("Game Complete!", canvasWidth * 0.2, canvasHeight * 0.5);
        ctx.fillStyle = "#33cc33";
        ctx.fillText("Game Complete!", canvasWidth * 0.202, canvasHeight * 0.502);
    }
}


function guessCharacter () {

    if (collectedChars.length > numGuessedChars) {
        if (charSet[guessedChar] == collectedChars[numGuessedChars]) {
            guessedChar = 0;
            playSound ("buzzerSound");
            numGuessedChars++;
        } else {
            guessedChar++;
        }
    } else {
        gameOver();
    }
}


function redrawScreen () {

    ctx.clear();
    drawBackground();

    if (playerDirection == "right" && playerX < canvasWidth - bucketWidth) {
        playerX += playerSpeed;
    } else if (playerDirection == "left" && playerX > 0) {
        playerX -= playerSpeed
    }

    // Allow the van to go off the page
    if (vanDirection == "right" && vanX < canvasWidth) {
        vanX += vanSpeed;
    } else if (vanDirection == "left" && vanX > -vanWidth) {
        vanX -= vanSpeed;
    }

    if (vanX >= canvasWidth) {
        vanDirection = "left";
    } else if (vanX <= -vanWidth) {
        vanDirection = "right";
    }

    drawBucket (playerX, playerY);
    drawVan (vanX, vanY);

    for (i = 0; i < fallingChars.length; i++) {

        var char = fallingChars[i];

        if (char.x >= playerX && char.x + charWidth/2 <= playerX + bucketWidth && char.y >= canvasHeight - bucketHeight && char.y <= canvasHeight - bucketHeight + charSpeed) {
            playSound("charCatchSound");
            collectedChars.push(char.value);
            fallingChars.splice (i, 1);
            score += 10 * 200 - char.value.charCodeAt(0);

            if (collectedChars.length == passwordLength) {
                    levelOver ();
            }
        } else {
            drawFallingChar (char.value, char.x, char.y);
        }

        if (char.y > canvasHeight - charWidth/2) {
            drawExplosion (char.x - charWidth/2, canvasHeight - explosionHeight);
        }

        if (char.y < canvasHeight) {
            char.y += charSpeed;
        } else {
            fallingChars.splice (i, 1);
            playSound ("explosionSound");
        }
    }

    score += 10;

    drawCollectedChars ();
    drawGuessedChar ();
    drawScore ();
}


function drawSplashScreen () {

    ctx.fillStyle = "#ffcce6";
    ctx.strokeStyle = "#000000";
    ctx.fillRect (canvasWidth * 0.2, canvasHeight * 0.1, canvasWidth * 0.6, canvasHeight * 0.8);
    ctx.strokeRect (canvasWidth * 0.2, canvasHeight * 0.1, canvasWidth * 0.6, canvasHeight * 0.8);

    ctx.fillStyle = "#b30059";
    ctx.font = charWidth + "px Courier New";
    ctx.fillText("Password Scramble", canvasWidth * 0.32, canvasHeight * 0.2);
    ctx.font = charWidth + "px Verdana";
    ctx.fillText("Level " + gameLevel, canvasWidth * 0.42, canvasHeight * 0.3);

    ctx.font = charWidth * 0.5 + "px Arial";
    ctx.strokeStyle = "#b30086";
    ctx.fillStyle = "#ffccf2";
    ctx.fillRect (canvasWidth * 0.225, canvasHeight * 0.34, canvasWidth * 0.55, canvasHeight * 0.22);
    ctx.strokeRect (canvasWidth * 0.225, canvasHeight * 0.34, canvasWidth * 0.55, canvasHeight * 0.22)
    var splashImage;
    ctx.fillStyle = "#000000";

    if (gameLevel == 1) {
        splashImage = document.getElementById("lobbyImage");
        ctx.fillText("It's your first day at work!", canvasWidth * 0.5, canvasHeight * 0.42);
        ctx.fillText("Time to choose a secure password.", canvasWidth * 0.48, canvasHeight * 0.5);
    } else if (gameLevel == 2) {
        splashImage = document.getElementById("calendarImage");
        ctx.fillText("Your password is nearly 75 days old.", canvasWidth * 0.48, canvasHeight * 0.42);
        ctx.fillText("Choose a new one before it expires!", canvasWidth * 0.48, canvasHeight * 0.5);
    } else if (gameLevel == 3) {
        splashImage = document.getElementById("tweetImage");
        ctx.fillText("Oops, you just tweeted your password!", canvasWidth * 0.47, canvasHeight * 0.40);
        ctx.fillText("Reset it before one of your devious", canvasWidth * 0.48, canvasHeight * 0.48);
        ctx.fillText("followers figures out what you've done.", canvasWidth * 0.47, canvasHeight * 0.52);
    } else if (gameLevel == 4) {
        splashImage = document.getElementById("janiceImage");
        ctx.fillText("Janice in accounting watched you", canvasWidth * 0.47, canvasHeight * 0.40);
        ctx.fillText("type in your password.", canvasWidth * 0.51, canvasHeight * 0.44);
        ctx.fillText("Better change it quick!", canvasWidth * 0.50, canvasHeight * 0.52);
    } else if (gameLevel == 5) {
        splashImage = document.getElementById("successkidImage");
        ctx.fillText("You clicked on a dodgy email link and now", canvasWidth * 0.44, canvasHeight * 0.40);
        ctx.fillText("a script kiddy has got your credentials.", canvasWidth * 0.46, canvasHeight * 0.44);
        ctx.fillText("Reset your password before script", canvasWidth * 0.46, canvasHeight * 0.5);
        ctx.fillText("kiddy can steal your identity.", canvasWidth * 0.48, canvasHeight * 0.54);
    }


    ctx.drawImage(splashImage, canvasWidth * 0.23, canvasHeight * 0.35, canvasWidth * 0.2, canvasHeight * 0.2);

    ctx.fillStyle = "#000000";
    ctx.font = charWidth * 0.38 + "px Verdana";
    ctx.fillText("Make the strongest possible password before the Password Cracker 2000 can break it.", canvasWidth * 0.22, canvasHeight * 0.65);
    ctx.fillText("Numbers and special characters take longer to guess and are worth more points.", canvasWidth * 0.23, canvasHeight * 0.7);
    ctx.font = charWidth * 0.5 + "px Courier New";
    ctx.fillText(String.fromCharCode(8592) + " " + String.fromCharCode(8594) + "    Move cart", canvasWidth * 0.25, canvasHeight * 0.75);
    ctx.fillText(" S     Sound on / off", canvasWidth * 0.25, canvasHeight * 0.8);
    ctx.fillText(" P     Pause", canvasWidth * 0.25, canvasHeight * 0.85);
}


function startLevel () {

    gameState = "INIT";
    drawBackground ();
    drawSplashScreen ();

    numGuessedChars = 0;
    guessedChar = 0;
    passwordLength = 6 + gameLevel * 2;
    fallingChars = [];
    collectedChars = [];

}


function newGame () {
    score = 0;
    gameLevel = 1;
    startLevel ();
}


$(window).load(function(){

    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.onclick = function() {

        if (gameState == "INIT") {
            gameState = "RUNNING";

            startAllIntervals (initialGuessDelay);

        } else if (gameState == "RUNNING") {
            toggleFullScreen();
        } else if (gameState == "LEVEL_COMPLETE") {
            startLevel ();
        } else if (gameState == "OVER") {
            showScore ();
        } else if (gameState == "SCORE_SUBMITTED") {
            newGame ();
        }
    }

    setScale();
    getPitch ();
    getKeystrokes ();

    newGame ();
})

$( document ).ready(function() {

    $("#close_score").click(function () {
        $('#score_popup').hide(500);
        $('#fade').hide(500);
    });

});
