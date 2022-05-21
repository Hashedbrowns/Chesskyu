//TODO: add sound, style scrollbar
const chess = new Chess()
const board = document.querySelector(".board")

populateBoard()

function populateBoard() {
	const boardRepr = chess.board()
	let img
	let piece
	let coordinates
	// populate board for inital position
	for (let row = 7; row >= 0; row--) {
		for (let column = 0; column < 8; column++) {
			if (boardRepr[row][column]) {
				piece = `pieces/${boardRepr[7 - row][column].color}${
					boardRepr[7 - row][column].type
				}.svg`
				coordinates = `#${String.fromCharCode(97 + column)}${row + 1}`
				coordinates = document.querySelector(coordinates)
				img = document.createElement("img")
				img.src = piece
				img.setAttribute("draggable", "true")
				coordinates.appendChild(img)
			}
		}
	}
}

let dragged
let dragPiece
let promotionMenuRef
let squareChanged = false
let clickedSquare = null
/* events fired on the draggable target */
board.addEventListener(
	"drag",
	function (event) {
		event.preventDefault()
	},
	false
)

board.addEventListener(
	"dragstart",
	function (event) {
		if (clickedSquare) {
			squareDefault(clickedSquare.parentNode)
			clickedSquare = null
			squareChanged = false
		}
		// store a ref. on the dragged elem
		dragged = event.target
		squareChanged = lastMove(dragged.parentNode)
		// make it half transparent
		event.target.style.opacity = 0.5
		possibleMoves = chess.moves({ square: dragged.parentNode.id })
		event.dataTransfer.effectAllowed = "copyMove"
	},
	false
)

board.addEventListener(
	"dragend",
	function (event) {
		// reset the transparency
		event.target.style.opacity = ""
	},
	false
)

/* events fired on the drop targets */
board.addEventListener(
	"dragover",
	function (event) {
		// prevent default to allow drop
		event.preventDefault()
	},
	false
)

board.addEventListener(
	"dragenter",
	function (event) {
		// highlight potential drop target when the draggable element enters it
		if (
			event.target.className === "white-square" ||
			event.target.className === "black-square" ||
			event.target.className === "last-move-white" ||
			event.target.className === "last-move-black" ||
			event.target.getAttribute("draggable") === "true"
		) {
			if (!(event.target === dragged)) {
				event.target.style.border = "medium solid white"
			}
		}
		event.dataTransfer.dropEffect = "copy"
	},
	false
)

board.addEventListener(
	"dragleave",
	function (event) {
		// reset background of potential drop target when the draggable element leaves it
		if (
			event.target.className === "white-square" ||
			event.target.className === "black-square" ||
			event.target.className === "last-move-white" ||
			event.target.className === "last-move-black" ||
			event.target.getAttribute("draggable") === "true"
		) {
			event.target.style.border = ""
		}
	},
	false
)

board.addEventListener(
	"drop",
	function (event) {
		if (squareChanged) {
			squareDefault(dragged.parentNode)
			squareChanged = false
		}
		// move dragged elem to the selected drop target
		if (event.target.getAttribute("draggable") === "true") {
			onDrop(dragged, event.target.parentNode)
		} else if (
			event.target.className === "white-square" ||
			event.target.className === "black-square" ||
			event.target.className === "last-move-white" ||
			event.target.className === "last-move-black"
		) {
			onDrop(dragged, event.target)
		}
		event.target.style.border = ""
	},
	false
)

const whiteModal = document.querySelector("#white-promotion")
const blackModal = document.querySelector("#black-promotion")

function onDrop(dragTarget, dropTarget) {
	const moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	dragPiece = `${dragTarget.src[dragTarget.src.length - 6]}${
		dragTarget.src[dragTarget.src.length - 5]
	}`
	const chessMove = chess.move(moveObject)
	// check if move is valid
	if (chessMove) {
		onValidMove(dragTarget.parentNode, dropTarget)
		if (chessMove.flags === "e") {
			// if en passant
			onEnPassant(dragTarget, dropTarget)
		} else if (chessMove.flags === "k" || chessMove.flags === "q") {
			onCastle(dragTarget, dropTarget, chessMove.flags)
		} else {
			onMove(dragTarget, dropTarget)
		}
		// check if move is pawn promotion
	} else if (
		(dragPiece === "bp" && dropTarget.id[1] === "1") ||
		(dragPiece === "wp" && dropTarget.id[1] === "8")
	) {
		if (
			chess
				.moves({ square: dragTarget.parentNode.id })
				.find((item) => item.includes(`${dropTarget.id}`))
		) {
			onPromotion(dropTarget.id)
			promotionMenuRef = (event) =>
				promotionMenu(event, dragTarget, dropTarget)
			board.addEventListener("dragstart", promotionDrag, {
				once: true,
			})
			board.addEventListener("click", promotionMenuRef, {
				once: true,
			})
		}
	}
}

function onMove(dragTarget, dropTarget) {
	// change dropTarget piece to dragTarget piece
	if (dropTarget.firstChild) {
		dropTarget.removeChild(dropTarget.firstChild)
	}
	dropTarget.appendChild(dragTarget)
}

function onEnPassant(dragTarget, dropTarget) {
	let targetPawn
	// check color
	if (dragPiece[0] === "w") {
		targetPawn = `#${dropTarget.id[0]}${Number(dropTarget.id[1]) - 1}`
	} else {
		targetPawn = `#${dropTarget.id[0]}${Number(dropTarget.id[1]) + 1}`
	}
	// remove target pawn and move dragged pawn
	targetPawn = document.querySelector(targetPawn)
	targetPawn.removeChild(targetPawn.firstChild)
	dropTarget.appendChild(dragTarget)
}

function onCastle(dragTarget, dropTarget, flag) {
	let rookInitSquare
	let rookFinalSquare
	if (dragPiece[0] === "w") {
		// castle for white
		if (flag === "k") {
			// castle for king side
			rookInitSquare = board.querySelector("#h1")
			rookFinalSquare = board.querySelector("#f1")
		} else {
			// castle for queen side
			rookInitSquare = board.querySelector("#a1")
			rookFinalSquare = board.querySelector("#d1")
		}
	} else {
		// castle for black
		if (flag === "k") {
			// castle for king side
			rookInitSquare = board.querySelector("#h8")
			rookFinalSquare = board.querySelector("#f8")
		} else {
			// castle for queen side
			rookInitSquare = board.querySelector("#a8")
			rookFinalSquare = board.querySelector("#d8")
		}
	}
	rookFinalSquare.appendChild(rookInitSquare.firstChild)
	dropTarget.appendChild(dragTarget)
}

function onPromotion(dropTarget) {
	// open promotion interface based on color
	if (dragPiece[0] === "w") {
		whiteModal.style.display = "grid"
		const promotionSquare = document.querySelector(`#${dropTarget}`)
		promotionSquare.appendChild(whiteModal)
	} else {
		blackModal.style.display = "grid"
		dropTarget = `${dropTarget[0]}${Number(dropTarget[1]) + 3}`
		const promotionSquare = document.querySelector(`#${dropTarget}`)
		promotionSquare.appendChild(blackModal)
	}
}

function promotionMenu(event, dragTarget, dropTarget) {
	const moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	board.removeEventListener("dragstart", promotionDrag)
	// if white promote
	if (dragPiece[0] === "w") {
		// remove promotion menu
		whiteModal.parentNode.removeChild(whiteModal)
		whiteModal.style.display = "none"
		if (
			event.target.parentNode.className === "white-content" &&
			event.target.className !== "close"
		) {
			// obtain promotion piece from click
			moveObject.promotion = event.target.src[event.target.src.length - 5]
			chess.move(moveObject)
			dragTarget.src = `pieces/${dragPiece[0]}${moveObject.promotion}.svg`
			onValidMove(dragTarget.parentNode, dropTarget)
			onMove(dragTarget, dropTarget)
		}
		// if black promote
	} else {
		// remove promotion menu
		blackModal.parentNode.removeChild(blackModal)
		blackModal.style.display = "none"
		if (
			event.target.parentNode.className === "black-content" &&
			event.target.className !== "close"
		) {
			// obtain promotion piece from click
			moveObject.promotion = event.target.src[event.target.src.length - 5]
			chess.move(moveObject)
			dragTarget.src = `pieces/${dragPiece[0]}${moveObject.promotion}.svg`
			onValidMove(dragTarget.parentNode, dropTarget)
			onMove(dragTarget, dropTarget)
		}
	}
}

function promotionDrag() {
	board.removeEventListener("click", promotionMenuRef)
	if (whiteModal.style.display === "grid") {
		// remove promotion menu
		whiteModal.parentNode.removeChild(whiteModal)
		whiteModal.style.display = "none"
	} else if (blackModal.style.display === "grid") {
		blackModal.parentNode.removeChild(blackModal)
		blackModal.style.display = "none"
	}
}

board.addEventListener("click", (event) => {
	if (!clickedSquare) {
		squareChanged = lastMove(event.target.parentNode)
		if (squareChanged) {
			clickedSquare = event.target
		}
	} else {
		if (squareChanged) {
			squareDefault(clickedSquare.parentNode)
			squareChanged = false
		}
		if (event.target.getAttribute("draggable") === "true") {
			onDrop(clickedSquare, event.target.parentNode)
		} else {
			onDrop(clickedSquare, event.target)
		}
		clickedSquare = null
	}
})

function squareDefault(optionalSquare = null) {
	if (optionalSquare && optionalSquare.className === "last-move-white") {
		optionalSquare.setAttribute("class", "white-square")
	} else if (optionalSquare) {
		optionalSquare.setAttribute("class", "black-square")
	} else {
		const lastMoveWhite = document.getElementsByClassName("last-move-white")
		const lastMoveBlack = document.getElementsByClassName("last-move-black")
		for (let i = 0; i < lastMoveWhite.length; ) {
			lastMoveWhite[i].setAttribute("class", "white-square")
		}
		for (let z = 0; z < lastMoveBlack.length; ) {
			lastMoveBlack[z].setAttribute("class", "black-square")
		}
	}
}

function lastMove(dragTarget, dropTarget = null) {
	let changed = false
	if (dragTarget.className === "white-square") {
		dragTarget.setAttribute("class", "last-move-white")
		changed = true
	} else if (dragTarget.className === "black-square") {
		dragTarget.setAttribute("class", "last-move-black")
		changed = true
	}
	if (dropTarget && dropTarget.className === "white-square") {
		dropTarget.setAttribute("class", "last-move-white")
		changed = true
	} else if (dropTarget) {
		dropTarget.setAttribute("class", "last-move-black")
		changed = true
	}
	return changed
}

const resetButton = document.querySelector(".reset-button")
resetButton.addEventListener("click", playAgain)
function playAgain() {
	allSquares = board.children
	for (let i = 0; i < allSquares.length; i++) {
		if (allSquares[i].firstChild) {
			allSquares[i].removeChild(allSquares[i].firstChild)
		}
	}
	squareDefault()
	chess.reset()
	populateBoard()
	while (movesDisplay.children.length > 1) {
		movesDisplay.removeChild(movesDisplay.lastChild)
	}
	movesDisplay.firstElementChild.lastElementChild.textContent = ""
	movesDisplay.firstElementChild.children[1].textContent = ""
	movesDisplay.firstElementChild.className = "last-turn"
	lastTurn = null
	gameOverModal.style.display = "none"
}

const gameOverModal = document.querySelector(".game-over")
function gameOver() {
	if (
		chess.in_checkmate() ||
		chess.in_draw() ||
		chess.in_stalemate() ||
		chess.in_threefold_repetition()
	) {
		gameOverModal.style.display = "block"
	}
}


const movesDisplay = document.querySelector(".moves")
function updateTurnDisplay() {
	const movesLength = chess.history().length
	let whiteTurn
	if (movesLength === 1) {
		whiteTurn = document.createElement("div")
		whiteTurn.className = "white-turn"
		whiteTurn.textContent = chess.history()[movesLength - 1]
		movesDisplay.appendChild(whiteTurn)
	} else if (movesLength % 2 === 0) {
		const blackTurn = document.createElement("div")
		blackTurn.className = "black-turn"
		blackTurn.textContent = chess.history()[movesLength - 1]
		movesDisplay.appendChild(blackTurn)
	} else {
		const turnNumber = document.createElement("div")
		turnNumber.textContent = Math.ceil(movesLength / 2)
		turnNumber.className = "turn-number"
		whiteTurn = document.createElement("div")
		whiteTurn.className = "white-turn"
		whiteTurn.textContent = chess.history()[movesLength - 1]
		movesDisplay.appendChild(turnNumber)
		movesDisplay.appendChild(whiteTurn)
	}
}
function onValidMove(dragTarget, dropTarget) {
	squareDefault()
	lastMove(dragTarget, dropTarget)
	updateTurnDisplay()
	gameOver()
}

const undoButton = document.querySelector(".undo-button")
undoButton.addEventListener("click", undoMove)

function undoMove() {
	const color = chess.turn()
	const moveToUndo = chess.undo()
	promotionDrag()
	if (moveToUndo) {
		const undoTo = board.querySelector(`#${moveToUndo.to}`)
		const undoFrom = board.querySelector(`#${moveToUndo.from}`)
		onUndo(undoTo, undoFrom)
		if (moveToUndo.flags === "c") {
			undoCapture(moveToUndo, undoTo, color)
		} else if (moveToUndo.flags === "e") {
			undoEnPassant(moveToUndo, color)
		} else if (moveToUndo.flags.length === 2) {
			if (moveToUndo.flags[0] === "c") {
				undoCapture(moveToUndo, undoTo, color)
			}
			undoPromotion(undoFrom)
		} else if (moveToUndo.flags === "k" || moveToUndo.flags === "q") {
			undoCastle(moveToUndo.flags,moveToUndo)
		}
	}
}
function undoCapture(moveToUndo, undoTo, color) {
	piece = `pieces/${color}${moveToUndo.captured}.svg`
	img = document.createElement("img")
	img.src = piece
	img.setAttribute("draggable", "true")
	undoTo.appendChild(img)
}

function undoEnPassant(moveToUndo, color) {
	let coordinates
	piece = `pieces/${color}${moveToUndo.captured}.svg`
	img = document.createElement("img")
	img.src = piece
	img.setAttribute("draggable", "true")
	if (color === "b") {
		coordinates = `${moveToUndo.to[0]}${Number(moveToUndo.to[1]) - 1}`
	} else {
		coordinates = `${moveToUndo.to[0]}${Number(moveToUndo.to[1]) + 1}`
	}
	const undoTo = board.querySelector(`#${coordinates}`)
	undoTo.appendChild(img)
}

function undoPromotion(undoFrom) {
	undoFrom.firstChild.src = `pieces/${chess.turn()}p.svg`
}

function undoCastle(flag,moveToUndo) {
	let rookInitSquare
	let rookFinalSquare
	if (moveToUndo.color === "w") {
		// castle for white
		if (flag === "k") {
			// castle for king side
			rookInitSquare = board.querySelector("#h1")
			rookFinalSquare = board.querySelector("#f1")
		} else {
			// castle for queen side
			rookInitSquare = board.querySelector("#a1")
			rookFinalSquare = board.querySelector("#d1")
		}
	} else {
		// castle for black
		if (flag === "k") {
			// castle for king side
			rookInitSquare = board.querySelector("#h8")
			rookFinalSquare = board.querySelector("#f8")
		} else {
			// castle for queen side
			rookInitSquare = board.querySelector("#a8")
			rookFinalSquare = board.querySelector("#d8")
		}
	}
	rookInitSquare.appendChild(rookFinalSquare.firstChild)
}

function onUndo(undoTo, undoFrom) {
	undoFrom.appendChild(undoTo.firstChild)
	squareDefault()
	const allMoves = chess.history({ verbose: true })
	if (allMoves.length > 0) {
		const newLastMove = allMoves[allMoves.length - 1]
		const moveFrom = board.querySelector(`#${newLastMove.from}`)
		const moveTo = board.querySelector(`#${newLastMove.to}`)
		lastMove(moveFrom, moveTo)
	}
	undoTurnDisplay(allMoves.length + 1)
}

function undoTurnDisplay(numberofMoves) {
	if (!(numberofMoves % 2 === 0 || movesDisplay.children.length === 2)) {
		movesDisplay.removeChild(movesDisplay.lastChild)
	} 
	movesDisplay.removeChild(movesDisplay.lastChild)

}