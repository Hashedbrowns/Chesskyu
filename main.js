//TODO: add sound, possible moves on click and drag start (maybe?), make layout responsive, chess ai
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
				img.setAttribute("class", "draggable-piece")
				coordinates.appendChild(img)
			}
		}
	}
}

let promotionMenuRef
let squareChanged = false
let clickedSquare = null
interact(".draggable-piece").styleCursor(false)
const position = { x: 0, y: 0 }
interact(".draggable-piece").draggable({
	listeners: {
		start(event) {
			if (
				event.target.src[event.target.src.length - 6] === chess.turn()
			) {
				event.target.style.cursor = "grabbing"
				// prevent drag and click from firing at same time
				board.removeEventListener("mouseup", onPieceClick)
				// prevent image overlap
				event.target.style.zIndex = "1"
				// clear click highlighting if exists
				if (clickedSquare) {
					squareDefault(clickedSquare.parentNode)
					clickedSquare = null
					squareChanged = false
				}
				// store a ref. on the dragged elem
				squareChanged = lastMove(event.target.parentNode)
				// center dragged element on cursor
				let rect = event.target.getBoundingClientRect()
				position.x -= rect.right - event.clientX
				position.x += event.target.offsetWidth / 2
				position.y -= rect.bottom - event.clientY
				position.y += event.target.offsetHeight / 2
			}
		},
		move(event) {
			if (
				event.target.src[event.target.src.length - 6] === chess.turn()
			) {
				// move dragged element based on cursor
				position.x += event.dx
				position.y += event.dy
				event.target.style.transform = `translate(${position.x}px, ${position.y}px)`
			}
		},
		end(event) {
			// clear click highlighting if exists
			event.target.style.removeProperty("cursor")
			event.target.style.removeProperty("z-index")
			// move dragged element to original position
			event.target.style.removeProperty("transform")
			position.x = 0
			position.y = 0
			board.addEventListener("mouseup", onPieceClick)
			if (
				event.target.src[event.target.src.length - 6] === chess.turn()
			) {
				squareDefault(event.target.parentNode)
				squareChanged = false
				clickedSquare = null
			}
		},
	},
	modifiers: [
		interact.modifiers.restrict({
			restriction: ".board",
		}),
	],
})

interact("div.board > *").dropzone({
	// only accept elements matching this CSS selector
	accept: ".draggable-piece",
	// Require a 50% element overlap for a drop to be possible
	overlap: 0.5,

	ondragenter: (event) => dropzoneDragEnter(event),
	ondragleave: (event) => dropzoneDragLeave(event),
	ondrop: (event) => dropzoneDrop(event),
})

function dropzoneDragEnter(event) {
	// add border to hovered square on enter
	if (
		event.target !== event.relatedTarget &&
		event.relatedTarget.className === "draggable-piece" &&
		event.relatedTarget.src[event.relatedTarget.src.length - 6] ===
			chess.turn()
	) {
		event.target.style.border = "medium solid white"
	}
}

function dropzoneDragLeave(event) {
	// remove border on hovered square on leave
	if (
		event.target !== event.relatedTarget &&
		event.relatedTarget.className === "draggable-piece" &&
		event.relatedTarget.src[event.relatedTarget.src.length - 6] ===
			chess.turn()
	) {
		event.target.style.border = ""
	}
}

function dropzoneDrop(event) {
	if (
		event.relatedTarget.src[event.relatedTarget.src.length - 6] ===
		chess.turn()
	) {
		// move dragged elem to the selected drop target
		if (event.relatedTarget.className === "draggable-piece") {
			onDrop(event.relatedTarget, event.target)
		}
		event.target.style.border = ""
	}
}

const whiteModal = document.querySelector("#white-promotion")
const blackModal = document.querySelector("#black-promotion")

function onDrop(dragTarget, dropTarget, preview = null) {
	let moveObject
	if (preview) {
		moveObject = preview
	} else {
		moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	}
	// representation of piece
	let dragPiece = `${dragTarget.src[dragTarget.src.length - 6]}${
		dragTarget.src[dragTarget.src.length - 5]
	}`
	const chessMove = chess.move(moveObject)
	// check if move is valid
	if (chessMove) {
		onValidMove(dragTarget.parentNode, dropTarget, preview)
		if (chessMove.flags === "e") {
			// if en passant
			onEnPassant(dragTarget, dropTarget)
		} else if (chessMove.flags === "k" || chessMove.flags === "q") {
			// if castle
			onCastle(dragTarget, dropTarget, chessMove.flags)
		} else if (chessMove.flags.length === 2) {
			// if promotion on undo
			onMove(dragTarget, dropTarget)
			dropTarget.firstChild.src = `pieces/${moveObject.color}${moveObject.promotion}.svg`
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
			if (clickedSquare) {
				// if piece was moved from click
				board.addEventListener("mousedown", promotionMenuRef, {
					once: true,
				})
			} else {
				// if piece was moved from drag
				board.addEventListener(
					"mouseup",
					() => {
						board.addEventListener("mousedown", promotionMenuRef, {
							once: true,
						})
					},
					{
						once: true,
					}
				)
			}
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
	if (chess.turn() === "b") {
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
	if (chess.turn() === "b") {
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
	if (chess.turn() === "w") {
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
	if (whiteModal.style.display === "grid") {
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
			dragTarget.src = `pieces/w${moveObject.promotion}.svg`
			onValidMove(dragTarget.parentNode, dropTarget)
			onMove(dragTarget, dropTarget)
		}
		// if black promote
	} else if (blackModal.style.display === "grid") {
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
			dragTarget.src = `pieces/b${moveObject.promotion}.svg`
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
board.addEventListener("mouseup", onPieceClick)

function onPieceClick(event) {
	if (
		!clickedSquare &&
		event.target.className === "draggable-piece" &&
		event.target.src[event.target.src.length - 6] === chess.turn()
	) {
		// if first click set square as first click
		squareChanged = lastMove(event.target.parentNode)
		if (squareChanged) {
			clickedSquare = event.target
		}
	} else if (clickedSquare) {
		// if second click check if move is valid
		squareDefault(clickedSquare.parentNode)
		squareChanged = false
		if (event.target.className === "draggable-piece") {
			onDrop(clickedSquare, event.target.parentNode)
		} else {
			onDrop(clickedSquare, event.target)
		}
		clickedSquare = null
	}
}
function squareDefault(optionalSquare = null) {
	// change specified highlighted square to regular square
	if (optionalSquare && optionalSquare.className === "last-move-white") {
		optionalSquare.setAttribute("class", "white-square")
	} else if (
		optionalSquare &&
		optionalSquare.className === "last-move-black"
	) {
		optionalSquare.setAttribute("class", "black-square")
	} else if (!optionalSquare) {
		// change all highlighted square to regular square
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
	// change regular square to highlighed square
	let changed = false
	if (dragTarget.className === "white-square") {
		dragTarget.setAttribute("class", "last-move-white")
		changed = true
	} else if (dragTarget.className === "black-square") {
		dragTarget.setAttribute("class", "last-move-black")
		changed = true
	}
	if (dropTarget) {
		// chenge optional square to highlighed square
		if (dropTarget.className === "white-square") {
			dropTarget.setAttribute("class", "last-move-white")
			changed = true
		} else {
			dropTarget.setAttribute("class", "last-move-black")
			changed = true
		}
	}
	return changed
}

const resetButton = document.querySelector(".reset-button")
resetButton.addEventListener("click", playAgain)
function playAgain() {
	const allSquares = board.children
	// clear board
	for (let i = 0; i < allSquares.length; i++) {
		if (allSquares[i].firstChild) {
			allSquares[i].removeChild(allSquares[i].firstChild)
		}
	}
	// reset game
	squareDefault()
	chess.reset()
	populateBoard()
	// remove moves from moves display
	while (movesDisplay.children.length > 1) {
		movesDisplay.removeChild(movesDisplay.lastChild)
	}
	gameOverModal.style.display = "none"
	undoneMoves = []
}

const gameOverModal = document.querySelector(".game-over")
function gameOver() {
	// check if game is over
	if (
		chess.in_checkmate() ||
		chess.in_draw() ||
		chess.in_stalemate() ||
		chess.in_threefold_repetition()
	) {
		gameOverModal.style.display = "block"
	} else {
		gameOverModal.style.display = "none"
	}
}

const movesDisplay = document.querySelector(".moves")
function updateTurnDisplay() {
	const movesLength = chess.history().length
	if (movesLength > 1) {
		// select last move
		movesDisplay.querySelector("#clicked-turn").removeAttribute("id")
	}
	let whiteTurn
	if (movesLength === 1) {
		// if first move
		whiteTurn = document.createElement("div")
		whiteTurn.className = "white-turn"
		whiteTurn.textContent = chess.history()[movesLength - 1]
		whiteTurn.setAttribute("id", "clicked-turn")
		movesDisplay.appendChild(whiteTurn)
	} else if (movesLength % 2 === 0) {
		// if black move
		const blackTurn = document.createElement("div")
		blackTurn.className = "black-turn"
		blackTurn.textContent = chess.history()[movesLength - 1]
		blackTurn.setAttribute("id", "clicked-turn")
		movesDisplay.appendChild(blackTurn)
	} else {
		// if white move
		const turnNumber = document.createElement("div")
		turnNumber.textContent = Math.ceil(movesLength / 2)
		turnNumber.className = "turn-number"
		whiteTurn = document.createElement("div")
		whiteTurn.className = "white-turn"
		whiteTurn.textContent = chess.history()[movesLength - 1]
		whiteTurn.setAttribute("id", "clicked-turn")
		movesDisplay.appendChild(turnNumber)
		movesDisplay.appendChild(whiteTurn)
	}
}
function onValidMove(dragTarget, dropTarget, preview = null) {
	// if a valid move is done
	squareDefault()
	lastMove(dragTarget, dropTarget)
	if (!preview) {
		updateTurnDisplay()
	}
	gameOver()
}

const undoButton = document.querySelector(".undo-button")
undoButton.addEventListener("click", () => undoButtonClick())

function undoButtonClick() {
	if (undoneMoves.length > 0) {
		// if during move preview
		let lastMove
		let moveFrom
		let moveTo
		while (undoneMoves.length > 1) {
			lastMove = undoneMoves.pop()
			moveFrom = lastMove.from
			moveTo = lastMove.to
			moveFrom = board.querySelector(`#${moveFrom}`)
			moveTo = board.querySelector(`#${moveTo}`)
			onDrop(moveFrom.firstChild, moveTo, lastMove)
		}
		undoneMoves.pop()
		gameOverModal.style.display = "none"
		movesDisplay.querySelector("#clicked-turn").removeAttribute("id")
		undoTurnDisplay(chess.history().length)
	} else {
		undoMove()
	}
	gameOver()
}

function undoMove(preview = false) {
	const color = chess.turn()
	const moveToUndo = chess.undo()
	if (moveToUndo) {
		// if valid undo
		promotionDrag()
		squareDefault()
		const undoTo = board.querySelector(`#${moveToUndo.to}`)
		const undoFrom = board.querySelector(`#${moveToUndo.from}`)
		onUndo(undoTo, undoFrom, preview)
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
			undoCastle(moveToUndo.flags, moveToUndo)
		}
	}
}
function undoCapture(moveToUndo, undoTo, color) {
	const piece = `pieces/${color}${moveToUndo.captured}.svg`
	const img = document.createElement("img")
	// place captured piece on board
	img.src = piece
	img.setAttribute("class", "draggable-piece")
	undoTo.appendChild(img)
}

function undoEnPassant(moveToUndo, color) {
	let coordinates
	const piece = `pieces/${color}${moveToUndo.captured}.svg`
	const img = document.createElement("img")
	// place captured pawn on board
	img.src = piece
	img.setAttribute("class", "draggable-piece")
	if (color === "b") {
		coordinates = `${moveToUndo.to[0]}${Number(moveToUndo.to[1]) - 1}`
	} else {
		coordinates = `${moveToUndo.to[0]}${Number(moveToUndo.to[1]) + 1}`
	}
	const undoTo = board.querySelector(`#${coordinates}`)
	undoTo.appendChild(img)
}

function undoPromotion(undoFrom) {
	// change source of pice to pawn
	undoFrom.firstChild.src = `pieces/${chess.turn()}p.svg`
}

function undoCastle(flag, moveToUndo) {
	let rookInitSquare
	let rookFinalSquare
	// undo rook move in castle
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

function onUndo(undoTo, undoFrom, preview) {
	// moves back user moved piece
	undoFrom.appendChild(undoTo.firstChild)
	const allMoves = chess.history({ verbose: true })
	if (allMoves.length > 0) {
		const newLastMove = allMoves[allMoves.length - 1]
		const moveFrom = board.querySelector(`#${newLastMove.from}`)
		const moveTo = board.querySelector(`#${newLastMove.to}`)
		lastMove(moveFrom, moveTo)
	}
	if (!preview) {
		undoTurnDisplay(allMoves.length)
	}
}

function undoTurnDisplay(numberofMoves) {
	// removes move from moves display
	if (numberofMoves % 2 === 0 && movesDisplay.children.length !== 2) {
		movesDisplay.removeChild(movesDisplay.lastChild)
	}
	movesDisplay.removeChild(movesDisplay.lastChild)
	if (numberofMoves > 0) {
		movesDisplay.lastChild.setAttribute("id", "clicked-turn")
	}
}
movesDisplay.addEventListener("click", previousMovePreview)
let undoneMoves = []
function previousMovePreview(event) {
	// move to selected move in turn display
	if (
		event.target.className === "black-turn" ||
		event.target.className === "white-turn"
	) {
		promotionDrag()
		gameOverModal.style.display = "block"
		movesDisplay.querySelector("#clicked-turn").removeAttribute("id")
		event.target.setAttribute("id", "clicked-turn")
		const previousMove = event.target.textContent
		const moveHistoryVerbose = chess.history({ verbose: true })
		const allMoves = movesDisplay.children
		let index
		let i = 0
		while (!index) {
			if (allMoves[i] === event.target) {
				index = i
			}
			i++
		}
		const moveNumber = index - (Math.floor(index / 3) + 1)
		if (moveNumber > moveHistoryVerbose.length - 1) {
			let moveFrom
			let moveTo
			let lastMove = moveHistoryVerbose[moveHistoryVerbose.length - 1]
			while (lastMove.san !== previousMove) {
				lastMove = undoneMoves.pop()
				moveFrom = lastMove.from
				moveTo = lastMove.to
				moveFrom = board.querySelector(`#${moveFrom}`)
				moveTo = board.querySelector(`#${moveTo}`)
				onDrop(moveFrom.firstChild, moveTo, lastMove)
			}
		} else {
			while (moveHistoryVerbose.length - 1 > moveNumber) {
				undoMove(true)
				undoneMoves.push(moveHistoryVerbose.pop())
			}
		}
		if (event.target === movesDisplay.lastChild) {
			gameOver()
		}
	}
}
// Step 1
const slider = interact(".slider") // target elements with the "slider" class
slider.styleCursor(false)
slider
	// Step 2
	.draggable({
		// make the element fire drag events
		origin: "self", // (0, 0) will be the element's top-left
		inertia: true, // start inertial movement if thrown
		modifiers: [
			interact.modifiers.restrict({
				restriction: "self", // keep the drag coords within the element
			}),
		],
		// Step 3
		listeners: {
			move(event) {
				// call this listener on every dragmove
				const sliderWidth = interact.getElementRect(event.target).width
				const value = event.pageX / sliderWidth
				event.target.style.paddingLeft = value * 100 + "%"
				event.target.setAttribute("data-value", value.toFixed(2))
			},
		},
	})
const preGameDisplay = document.querySelector(".pre-game")
const colorButton = document.querySelector(".colors")
const newGameButton = document.querySelector(".new-game-button")
const duringGameDisplay = document.querySelector(".during-game")
const singlePlayer = document.querySelector(".single-player")
const twoPlayer = document.querySelector(".two-player")
singlePlayer.addEventListener("click", () => {
	singlePlayer.style.color = "#8fbcbb"
	twoPlayer.style.color = "#aaaaaa"
})
twoPlayer.addEventListener("click", () => {
	twoPlayer.style.color = "#8fbcbb"
	singlePlayer.style.color = "#aaaaaa"
})
colorButton.addEventListener("click", (event) => {
	if (event.target.className === "chess-color") {
		preGameDisplay.style.display = "none"
		duringGameDisplay.style.display = "grid"
		gameOverModal.style.display = "none"
		const color = event.target.src[event.target.src.length - 6]
		if (
			(color === "b" && board.firstElementChild === gameOverModal) ||
			(color === "w" && board.firstElementChild !== gameOverModal)
		) {
			reverseBoard()
		}
	}
})
newGameButton.addEventListener("click", () => {
	duringGameDisplay.style.display = "none"
	preGameDisplay.style.display = "grid"
	playAgain()
	gameOverModal.style.display = "block"
})

function reverseBoard() {
	const divs = board.children
	let i = divs.length - 1
	for (; i--; ) {
		board.appendChild(divs[i])
	}
}