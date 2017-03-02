//some canvas properties for drawing gameBoard
var canvas = document.getElementById('checkers');
var ctx = canvas.getContext('2d');
var grid_block = canvas.height / 8;

//game color properties
var clientTrim = applyColor("Client", "Trim");//"rgb(153, 0, 0)";
var clientColor = applyColor("Client", "Base");// "rgb(255,0,0)";
var AITrim = applyColor("AI", "Trim"); //"rgb(153,153,153)"
var AIColor = applyColor("AI", "Base"); //"rgb(255, 255, 255)";
var kingTrimAI = applyColor("AI", "King");// "rgb(230, 172, 0)"
var kingTrimClient = applyColor("Client", "King");// "rgb(230, 172, 0)"

//2d array that will hold the game board
var gameBoard = new Array(8);
for(var k = 0; k < 8; k++){
	gameBoard[k] = new Array(8);
}

var clientPieces = new Array(12);
var AIPieces = new Array(12);

//game play properties
var yourTurn = true;
var pieceSelected;
var mulitJump = false;
var Winner = "none";
var jumpMade = false;
var inPlay = false;
var AIScore = 0;
var ClientScore = 0;


//---------------game setup and pieces---------------

/**
*checkers piece for use in checkers game
*
*args
*   color- string of the color for this checkers piece
*   alive- state of this checkers piece;
*   x- the grid x coord for this game piece
*   y- the grid y coord for this game piece
*/
function checkers_piece(color, alive, x, y) {
    //team indicator
    this.color = color;
    //active spot
    this.alive = alive;
    //is kinged
	this.kinged = false;
    //selected spot or spot to move
	this.highlighted = false;

    //location in grid
	this.gridX = x;
	this.gridY = y;

    //this piece needs to jump
	this.jumpUpLeft = false;
	this.jumpDownLeft = false;
	this.jumpUpRight = false;
	this.jumpDownRight = false;

    //this piece can make following steps
	this.stepUpLeft = false;
	this.stepDownLeft = false;
	this.stepUpRight = false;
	this.stepDownRight = false;

    //can this piece jump?
	this.canJump = function(){
        return this.jumpUpLeft || this.jumpDownLeft || this.jumpUpRight || this.jumpDownRight;
	}

    //clear all potential jumps- jumps should be re-evaluated
	this.clearJumps = function () {
	    this.jumpUpLeft = false;
	    this.jumpDownLeft = false;
	    this.jumpUpRight = false;
	    this.jumpDownRight = false;
	}

    //can this piece step?
	this.canStep = function(){
	    return this.stepUpLeft || this.stepDownLeft || this.stepUpRight || this.stepDownRight;
	}

    //clear all potential steps- steps should be re-evaluated
	this.clearSteps = function(){
	    this.stepUpLeft = false;
	    this.stepDownLeft = false;
	    this.stepUpRight = false;
	    this.stepDownRight = false;
	}

    //clear all base information about this piece
	this.clear = function(){
		this.alive = false;
		this.kinged = false;
		this.hightlighted = false;
		this.color = "none";
		this.clearJumps();
		this.clearSteps();
	}
	
    //update base information about this piece
	this.update = function(color,alive,kinged){
		this.color = color;
		this.alive = alive;
		this.kinged = kinged;
	}
	
    //king this piece
	this.king_me = function(){
		this.kinged = true;
	}
}

/**
*reset the game board to its base condition (new game)
*/
function resetBoard() {
    //reset base gameplay state conditions
    inPlay = true;
    yourTurn = true;
    pieceSelected = null;
    mulitJump = false;
    Winner = "none";
    jumpMade = false;

    //reset the board
    var clientCount = 0;
    var AICount = 0;
	for(var i = 0; i < 8; i++){
		for(var j = 0; j < 8; j++){
		    if (i % 2 == j % 2) {
                //set game board AI pieces
			    if (j < 3) {
			        var piece = new checkers_piece("white", true, i, j);
				    gameBoard[i][j] = piece
				    AIPieces[AICount] = piece;
				    AICount++;
			    }
                //set game board client pieces
				else if(j > 4){
				    var piece = new checkers_piece("red", true, i, j);
				    gameBoard[i][j] = piece
				    clientPieces[clientCount] = piece;
				    clientCount++;
				}
				else{
				    gameBoard[i][j] = new checkers_piece("none", false,i,j);
				}
				
			}
			else{
			    gameBoard[i][j] = new checkers_piece("none", false,i,j);
			}
		}
	}
	draw();
}

//---------------End Game and misc interface operations---------------

//continue
function endGame() {
    inPlay = false;
    if (Winner == "client") {
        ClientScore++;
        document.getElementById("Client_score").innerHTML = ClientScore;
        customAlert("You Win!");
    }
    else {
        AIScore++;
        document.getElementById("CPU_score").innerHTML = AIScore;
        customAlert("You Lose");
    }
}


function customAlert(message){
    var fadeOver = document.getElementById('fadeOut');
    var contentBox = document.getElementById('AlertBox');
    fadeOver.style.display = "block";
    contentBox.style.display = "block";
    document.getElementById('AlertHeader').innerHTML = message;
    document.getElementById('AlertBody').innerHTML = "Do You Want To Play Again?";
    document.getElementById("yes_button").onclick = function(){
        resetBoard();
        document.getElementById('AlertBox').style.display = "none";
        document.getElementById('fadeOut').style.display = "none";
    };
    document.getElementById("no_button").onclick = function () {
        document.getElementById('AlertBox').style.display = "none";
        document.getElementById('fadeOut').style.display = "none";
    };
}

document.getElementById("play_again").onclick = function(){
    if (inPlay) {
        alert("you foreit");
        AIScore++;
        document.getElementById("CPU_score").innerHTML = AIScore;
    }
    resetBoard();
}



//---------------client actions handled---------------


/**
*the game board was clicked on. preform necessary game state updates based on what was clicked on
*
*/
canvas.onclick = function (event) {
    
    if(inPlay){
        //can't move if its not your turn
        if (yourTurn) {
            evaluatePieces(clientPieces);
            //get grid indices
            var rect = canvas.getBoundingClientRect();
            var xCoord = event.clientX - rect.left;
            var yCoord = event.clientY - rect.top;
            xCoord = Math.floor(xCoord / grid_block);
            yCoord = Math.floor(yCoord / grid_block);

            //this is the spot selected
            var piece = gameBoard[xCoord][yCoord];

            //the spot selected is a highlighted inactive piece that is not the current piece
            //this must be a move
            if (piece.highlighted && piece != pieceSelected && !piece.alive && pieceSelected) {
                makeMove(piece);

            }
                //the spot selected may be a client piece that might be able to move
            else if(!mulitJump) {

                //this piece needs to be the clients
                if (piece.color == "red" && piece.alive) {
                    //unhighlight previous piece selected
                    //and that pieces move spots if there is a previous piece
                    if (pieceSelected) {
                        pieceSelected.highlighted = false;
                        highlightMoveSpots(pieceSelected, false);
                    }
                    //hightlight this piece and its moves spots
                    pieceSelected = piece;
                    piece.highlighted = true;
                    highlightMoveSpots(piece, true)
                }
            }
            draw();
        }
    }
}



//---------------AI actions/ logic handled---------------

function AI_MOVE() {
    if (inPlay) {
        if (!yourTurn) {
            var jumpPieces;
            var movePieces;

            //make evaluations
            evaluatePieces(AIPieces);
            jumpPieces = getJumpPieces(AIPieces);
            movePieces = getMovePieces(AIPieces);
            if (jumpPieces.length > 0) {
                var movePieceIndex = getRandomIndex(jumpPieces.length);
                pieceSelected = jumpPieces[movePieceIndex];
                var moveOpertions = new Array(0);
                if (pieceSelected.jumpDownLeft) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX-2][pieceSelected.gridY+2])
                }
                if (pieceSelected.jumpDownRight) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX+2][pieceSelected.gridY+2])
                }
                if (pieceSelected.jumpUpLeft) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX-2][pieceSelected.gridY-2])
                }
                if (pieceSelected.jumpUpRight) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX+2][pieceSelected.gridY-2])
                }
                var targetIndex = getRandomIndex(moveOpertions.length);
                var targetPiece = moveOpertions[targetIndex];
                makeMove(targetPiece);
            }
            else if(movePieces.length > 0){
                var movePieceIndex = getRandomIndex(movePieces.length);
                pieceSelected = movePieces[movePieceIndex];
                var moveOpertions = new Array(0);
                if (pieceSelected.stepDownLeft) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX - 1][pieceSelected.gridY + 1])
                }
                if (pieceSelected.stepDownRight) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX + 1][pieceSelected.gridY + 1])
                }
                if (pieceSelected.stepUpLeft) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX - 1][pieceSelected.gridY - 1])
                }
                if (pieceSelected.stepUpRight) {
                    moveOpertions.push(gameBoard[pieceSelected.gridX + 1][pieceSelected.gridY - 1])
                }
                var targetIndex = getRandomIndex(moveOpertions.length);
                var targetPiece = moveOpertions[targetIndex];
                makeMove(targetPiece);
            }
            else {
                Winner = "client";
                endGame();
            }
        }
        draw();
    }
}

//gets a ranndom integer within the range. 
//the min is inclusive the max is exclusive
function getRandomIndex(Bound) {
    return Math.floor(Math.random() * Bound);
}

function getJumpPieces(pieces) {
    var jumppers = new Array(0);
    for(var i = 0; i < pieces.length;i++){
        if (pieces[i].canJump()) {
            jumppers.push(pieces[i]);
        }
    }
    return jumppers;
}

function getMovePieces(pieces) {
    var steppers = new Array(0);
    for (var i = 0; i < pieces.length; i++) {
        if (pieces[i].canStep()) {
            steppers.push(pieces[i]);
        }
    }
    return steppers;
}

//---------------board / game generic updating---------------



/**
*a move has been made, update the game state accordingly
*
*/
function makeMove(newPiece) {
    mulitJump = false;
    //clear highlighted spots from selected piece
    highlightMoveSpots(pieceSelected, false);
    pieceSelected.highlighted = false;

    //deterimine if a jump was made and what piece to remove
    //this will also update win state if all of 1 teams pieces are gone
    if (pieceSelected.canJump()) {
        jumpMade = true;
        var xDiff = pieceSelected.gridX - newPiece.gridX;
        var yDiff = pieceSelected.gridY - newPiece.gridY;
        var pieceRemoved;
        //left jump
        if (xDiff > 1) {
            //up jump
            if (yDiff > 1) {
                pieceRemoved = gameBoard[pieceSelected.gridX - 1][pieceSelected.gridY - 1];
            }
            //down jump
            else {
                pieceRemoved = gameBoard[pieceSelected.gridX - 1][pieceSelected.gridY + 1];
            }
        }
        //right jump
        else {
            //up jump
            if (yDiff > 1) {
                pieceRemoved = gameBoard[pieceSelected.gridX + 1][pieceSelected.gridY - 1];
            }
            //down jump
            else {
                pieceRemoved = gameBoard[pieceSelected.gridX + 1][pieceSelected.gridY + 1];
            }
        }
        
        //check what color the piece to remove is
        //and remove it also call win handler if there is winner
        if (pieceRemoved.color == "red") {
            var index = findSelectedPieceIndex(clientPieces, pieceRemoved);
            clientPieces.splice(index, 1);
            if (clientPieces.length == 0) {
                Winner = "AI";
            }
        }
        else {
            var index = findSelectedPieceIndex(AIPieces, pieceRemoved);
            AIPieces.splice(index, 1);
            if (AIPieces.length == 0) {
                Winner = "client";
            }
        }
        pieceRemoved.clear();
    }

    //copy selected piece information to the new spot
    newPiece.update(pieceSelected.color, true, pieceSelected.kinged);

    //if the new spot is at the king position and the piece is not kinged- king me
    if (newPiece.color == "red") {
        if (newPiece.gridY == 0 && !newPiece.kinged) {
            newPiece.king_me();
        }
    }
    else {
        if (newPiece.gridY == 7 && !newPiece.kinged) {
            newPiece.king_me();
        }
    }

    //replace selectedPiece in client/AI pieces with new piece
    if (pieceSelected.color == "red") {
        var selectedIndex = findSelectedPieceIndex(clientPieces, pieceSelected);
        clientPieces[selectedIndex] = newPiece;
    }
    else {
        var selectedIndex = findSelectedPieceIndex(AIPieces, pieceSelected);
        AIPieces[selectedIndex] = newPiece;
    }
    
    
    //clear information off the selected piece old location
    pieceSelected.clear();

    evaluatePieces(AIPieces);
    var jumpPieces = getJumpPieces(AIPieces);
    var movePieces = getMovePieces(AIPieces);
    //there is no other moves to make gameOver
    if (jumpPieces.length == 0 && movePieces.length == 0 || AIPieces.length == 0) {
        Winner = "client";
    }

    evaluatePieces(clientPieces);
    var jumpPieces = getJumpPieces(clientPieces);
    var movePieces = getMovePieces(clientPieces);
    //there is no other moves to make gameOver
    if (jumpPieces.length == 0 && movePieces.length == 0 || clientPieces.length == 0) {
        Winner = "AI";
    }

    //evaluate if the new piece has any jumps if so its still the current turn if a jump was previously made
    //update selected piece to the new piece
    evaluateJump(newPiece);
    if (newPiece.canJump() && jumpMade) {
        mulitJump = true;
        jumpMade = false;
        pieceSelected = newPiece;
        if (yourTurn) {
            pieceSelected.highlighted = true;
            highlightMoveSpots(pieceSelected, true)
        }
        else {
            //continue
            draw();
            var moveOpertions = new Array(0);
            if (pieceSelected.jumpDownLeft) {
                moveOpertions.push(gameBoard[pieceSelected.gridX - 2][pieceSelected.gridY + 2])
            }
            if (pieceSelected.jumpDownRight) {
                moveOpertions.push(gameBoard[pieceSelected.gridX + 2][pieceSelected.gridY + 2])
            }
            if (pieceSelected.jumpUpLeft) {
                moveOpertions.push(gameBoard[pieceSelected.gridX - 2][pieceSelected.gridY - 2])
            }
            if (pieceSelected.jumpUpRight) {
                moveOpertions.push(gameBoard[pieceSelected.gridX + 2][pieceSelected.gridY - 2])
            }
            var targetIndex = getRandomIndex(moveOpertions.length);
            var targetPiece = moveOpertions[targetIndex];
            setTimeout(function () {
                makeMove(targetPiece);
            }, 500);
            
        }
    }
    //no more moves turn ends
    else {
        jumpMade = false;
        pieceSelected = null;
        yourTurn = !yourTurn;
        draw();

        if (Winner != "none") {
            setTimeout(function () {
                endGame();
            }, 500);
            return;
        }
        
        if (!yourTurn) {
            //the canvas needs some time to load before AI moves can be processed.
            //this will give a feel of turn based gameplay
            setTimeout(function () {
                AI_MOVE();
            }, 500);
            
        }
    }
    
}


/**
*highlights the places that a selected piece can move to.
*   -if the selected piece can jump it is required to make the jump
*   -if the selected piece cannot jump but another of the players piece can jump
*       the selected piece will not have any moves available to it
*
*args:
*   piece- checkers piece that is selected
*   on_off- wheter the highlight places are being disabled of enabled
*/
function highlightMoveSpots(piece, on_off) {
    var x = piece.gridX;
    var y = piece.gridY;

    //piece must be alive to even hilight move spots
    if(!piece.alive){
        return;
    }

    

    //if there are jumps available this piece can only jump
    if (piece.canJump()) {
        if (piece.jumpDownLeft) {
            gameBoard[x - 2][y + 2].highlighted = on_off;
        }
        if (piece.jumpDownRight) {
            gameBoard[x + 2][y + 2].highlighted = on_off;
        }
        if (piece.jumpUpLeft) {
            gameBoard[x - 2][y - 2].highlighted = on_off;
        }
        if (piece.jumpUpRight) {
            gameBoard[x + 2][y - 2].highlighted = on_off;
        }
    }
    //if no jumps available and there are steps available then this piece can step
    else if(canAnyPieceJump(clientPieces) == 0 && piece.canStep){
        if (piece.stepDownLeft) {
            gameBoard[x - 1][y + 1].highlighted = on_off;
        }
        if (piece.stepDownRight) {
            gameBoard[x + 1][y + 1].highlighted = on_off;
        }
        if (piece.stepUpLeft) {
            gameBoard[x - 1][y - 1].highlighted = on_off;
        }
        if (piece.stepUpRight) {
            gameBoard[x + 1][y - 1].highlighted = on_off;
        }
    }
}




//---------------board / game evaluation---------------

/**
*finds the index of the target piece in the given pieces array if in the array
*
*args:
*   pieces- array of pieces to check for selected piece
*   targetPiece- checkers piece that is trying to be located
*/
function findSelectedPieceIndex(pieces, targetPiece) {
    for (var i = 0; i < pieces.length; i++) {
        if (pieces[i].gridX == targetPiece.gridX && pieces[i].gridY == targetPiece.gridY) {
            return i;
        }
    }
    return -1;

}

/**
*evaluate all the pieces potential moves based on the array of checkers pieces given
*
*args:  
*   pieces- the checkers pieces to be evaluated
*/
function evaluatePieces(pieces){
    for (var i = 0; i < pieces.length; i++) {
        evaluateJump(pieces[i]);
    }
    for (var i = 0; i < pieces.length; i++) {
        evaluateStep(pieces[i]);
    }
}


/**
*determines all potential jumps for the given piece
*
*args:  
*   piece- the checkers piece to be evaluated
*/
function evaluateJump(piece) {
    if (!piece.alive) {
        return false;
    }

    //assume piece cannot jump before evaluation
    piece.clearJumps();

    var x = piece.gridX;
    var y = piece.gridY;
    var opponentColor;

    if (piece.color == "red") {
        opponentColor = "white";
    }
    else {
        opponentColor = "red";
    }

    //check all jumps regardless of king or not

    //possible left jump
    if (x > 1) {
        //check up left
        if (y > 1) {
            if (gameBoard[x - 1][y - 1].color == opponentColor && !gameBoard[x - 2][y - 2].alive) {
                piece.jumpUpLeft = true;
            }
        }

        //check down left
        if (y < 6) {
            if (gameBoard[x - 1][y + 1].color == opponentColor && !gameBoard[x - 2][y + 2].alive) {
                piece.jumpDownLeft = true;
            }  
        }
    }
    //possible right jump
    if (x < 6) {
        //check up right
        if (y > 1) {
            if (gameBoard[x + 1][y - 1].color == opponentColor && !gameBoard[x + 2][y - 2].alive) {
                piece.jumpUpRight = true;
            }
        }
        //check down right
        if (y < 6) {
            if (gameBoard[x + 1][y + 1].color == opponentColor && !gameBoard[x + 2][y + 2].alive) {
                piece.jumpDownRight = true;
            }
        }
    }

    //now check kinged condition
    if (!piece.kinged) {
        if (piece.color == "red") {
            piece.jumpDownLeft = false;
            piece.jumpDownRight = false;
        } else {
            piece.jumpUpLeft = false;
            piece.jumpUpRight = false;
        }

    }
    
}


/**
*determines all potential steps for the given piece
*
*args:  
*   piece- the checkers piece to be evaluated
*/
function evaluateStep(piece) {
    if (!piece.alive) {
        return false;
    }

    //assume piece cannot jump before evaluation
    piece.clearSteps();

    var x = piece.gridX;
    var y = piece.gridY;

    //check all steps regardless of king or not

    //possible step left
    if (x > 0) {
        //check up left
        if (y > 0) {
            if (!gameBoard[x - 1][y - 1].alive) {
                piece.stepUpLeft = true;
            }
        }

        //check down left
        if (y < 7) {
            if (!gameBoard[x - 1][y + 1].alive) {
                piece.stepDownLeft = true;
            }  
        }
    }
    //possible right step
    if (x < 7) {
        //check up right
        if (y > 0) {
            if (!gameBoard[x + 1][y - 1].alive) {
                piece.stepUpRight = true;
            }
        }
        //check down right
        if (y < 7) {
            if (!gameBoard[x + 1][y + 1].alive) {
                piece.stepDownRight = true;
            }
        }
    }

    //now check kinged condition
    if (!piece.kinged) {
        if(piece.color == "red"){
            piece.stepDownLeft = false;
            piece.stepDownRight = false;
        }
        else{
            piece.stepUpLeft = false;
            piece.stepUpRight = false;
        }
    }
    
}

/**
*determines if any of the given pieces can jump
*
*args:  
*   pieces- array of pieces that may be able to jump
*/
function canAnyPieceJump(pieces) {
    var count = 0;
    for(var i = 0; i < pieces.length; i++){
        if (pieces[i].canJump()) {
            count++;
        }
    }
    return count;
}


//---------------drawing of the game board based on state of games---------------

/**
*draw the current state of the game board
*
*/
function draw()
{
    // is Canvas supported?
    if(ctx)
    {
		drawBackground();
		drawGame();
		
    }
	//canvas is not supported... can't play
    else
    {
        alert("Canvas not supported!");
    }
}

/**
*draw the base board as a background
*
*/
function drawBackground(){
	for(var i = 0; i < 8; i++){
		for(var j = 0; j < 8; j++){
			if(i % 2 == j % 2){
				ctx.fillStyle = "black";
			}
			else{
				ctx.fillStyle = "white";
			}
			
			ctx.fillRect(i * grid_block, j * grid_block, grid_block, grid_block);
			ctx.stroke();
		}
	}	
}

/**
*draw in all the pieces based on the current game state
*also draws other game state features
*/
function drawGame() {
    var circle_size = grid_block * .4;
    var offset = grid_block / 2;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var piece = gameBoard[i][j];
            var x = i * grid_block + offset;
            var y = j * grid_block + offset;


            //highlighting under piece and spots that piece can be moved to when a piece is selected
            if (piece.highlighted) {
                var grd = ctx.createRadialGradient(x, y, 5, x, y, grid_block);
                grd.addColorStop(0, "yellow");
                grd.addColorStop(1, "black");

                // Fill with gradient
                ctx.fillStyle = grd;
                ctx.fillRect(i * grid_block, j * grid_block, grid_block, grid_block);
                ctx.stroke();
            }

            //if this is an active piece display the piece based on its characteristics
            if (piece.alive) {
                if (piece.kinged) {
                    if (piece.color == "red") {
                        ctx.fillStyle = kingTrimClient;
                    }
                    else {
                        ctx.fillStyle = kingTrimAI;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(x, y, circle_size+4, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.stroke();

                }
                else if(piece.color == "red") {
                    ctx.fillStyle = clientTrim;
                    ctx.beginPath();
                    ctx.arc(x, y, circle_size + 4, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                else{
                    ctx.fillStyle = AITrim;
                    ctx.beginPath();
                    ctx.arc(x, y, circle_size + 4, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }



                if (piece.color == "red") {
                    ctx.fillStyle = clientColor;
                }
                else {
                    ctx.fillStyle = AIColor;
                }
                
                ctx.beginPath();
                ctx.arc(x, y, circle_size, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    var turnCanvas = document.getElementById("turnColor");

    if (yourTurn) {
        turnCanvas.style.background = clientColor;
    }
    else {
        turnCanvas.style.background = AIColor;
    }
}

//reset and color board
resetBoard();

//-----------------Color Changing-----------------------
//apple colors that are entered
//AI colors
document.getElementById("apply_AITrim").onclick = function () {
    AITrim = applyColor("AI", "Trim");
    draw();
}

document.getElementById("apply_AIBase").onclick = function () {
    AIColor = applyColor("AI", "Base");
    draw();
}


document.getElementById("apply_AIKing").onclick = function () {
    kingTrimAI = applyColor("AI", "King");
    draw();
}


//Client colors
document.getElementById("apply_ClientTrimTrim").onclick = function () {
    clientTrim = applyColor("Client","Trim");
    draw();
}

document.getElementById("apply_ClientBase").onclick = function () {
    clientColor = applyColor("Client", "Base");
    draw();
}

document.getElementById("apply_ClientKing").onclick = function () {
    kingTrimClient = applyColor("Client", "King");
    draw();
}

//apply the given color
function applyColor(player,area) {
    var r = document.getElementById(player + "_RedAmt" + area);
    var g = document.getElementById(player + "_GreenAmt" + area);
    var b = document.getElementById(player + "_BlueAmt" + area);

    r = r.value ? r.value : 0;
    g = g.value ? g.value : 0;
    b = b.value ? b.value : 0;

    return "rgb(" + r + "," + g + "," + b + ")";
}

//continuesly animate the color picker to show what will be applied
function animateColorPicker() {
    var ClientCanvas = document.getElementById("Client_ColorDisplay")
    var AICanvas = document.getElementById("AI_ColorDisplay");
    drawColors(ClientCanvas, "Client");
    drawColors(AICanvas, "AI");
    requestAnimationFrame(animateColorPicker);
}

//draw the color picker
function drawColors(selected_canvas, player) {
    var circle_size = selected_canvas.height / 2.5;
    var x = selected_canvas.height / 2;
    var y = selected_canvas.height / 2;
    var context = selected_canvas.getContext("2d");
    if (document.getElementById(player + "_KingChecked").checked) {
        context.fillStyle = applyColor(player, "King");
        context.beginPath();
        context.arc(x, y, circle_size + 8, 0, 2 * Math.PI, false);
        context.fill();
        context.lineWidth = 1;
        context.stroke();
    }
    else {
        context.fillStyle = applyColor(player, "Trim");
        context.beginPath();
        context.arc(x, y, circle_size + 8, 0, 2 * Math.PI, false);
        context.fill();
        context.lineWidth = 1;
        context.stroke();
    }

    context.fillStyle = applyColor(player, "Base");
    context.beginPath();
    context.arc(x, y, circle_size, 0, 2 * Math.PI, false);
    context.fill();
    context.lineWidth = 1;
    context.stroke();
}

//start color picker animation loop
animateColorPicker();