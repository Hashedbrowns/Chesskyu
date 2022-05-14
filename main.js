//TODO: when dragging after click remove highlight on clicked square
// redo move if player clicks away during promotion
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
			if (clickedSquare.parentNode.className === "last-move-white") {
				clickedSquare.parentNode.setAttribute("class", "white-square")
			} else {
				clickedSquare.parentNode.setAttribute("class", "black-square")
			}
			clickedSquare = null
			squareChanged = false
		}
		// store a ref. on the dragged elem
		dragged = event.target
		if (dragged.parentNode.className === "white-square") {
			dragged.parentNode.setAttribute("class", "last-move-white")
			squareChanged = true
		} else if (dragged.parentNode.className === "black-square") {
			dragged.parentNode.setAttribute("class", "last-move-black")
			squareChanged = true
		}
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
			if (dragged.parentNode.className === "last-move-white") {
				dragged.parentNode.setAttribute("class", "white-square")
			} else {
				dragged.parentNode.setAttribute("class", "black-square")
			}
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
	let moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	dragPiece = `${dragTarget.src[dragTarget.src.length - 6]}${
		dragTarget.src[dragTarget.src.length - 5]
	}`
	let chessMove = chess.move(moveObject)
	if (chessMove) {
		if (chessMove.flags === "e") {
			// if en passant
			onEnPassant(dragTarget, dropTarget)
		} else if (chessMove.flags === "k" || chessMove.flags === "q") {
			onCastle(dragTarget, dropTarget, chessMove.flags)
		} else {
			onMove(dragTarget, dropTarget)
		}
	} else if (
		// check if move is pawn promotion
		(dragPiece === "bp" && dropTarget.id[1] === "1") ||
		(dragPiece === "wp" && dropTarget.id[1] === "8")
	) {
		/* TODO: Make interface for promotion choice */
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
			document.addEventListener("click", promotionMenuRef, { once: true })
		}
	}
}

function onMove(dragTarget, dropTarget) {
	squareDefault()
	lastMove(dragTarget.parentNode, dropTarget)
	// change dropTarget piece to dragTarget piece
	if (dropTarget.firstChild) {
		dropTarget.removeChild(dropTarget.firstChild)
	}
	dragTarget.parentNode.removeChild(dragTarget)
	dropTarget.appendChild(dragTarget)
}

function onEnPassant(dragTarget, dropTarget) {
	let targetPawn
	squareDefault()
	lastMove(dragTarget.parentNode, dropTarget)
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
	squareDefault()
	lastMove(dragTarget.parentNode, dropTarget)
	if (dragPiece[0] === "w") {
		// castle for white
		if (flag === "k") {
			// castle for king side
			rookInitSquare = document.querySelector("#h1")
			rookFinalSquare = document.querySelector("#f1")
		} else {
			// castle for queen side
			rookInitSquare = document.querySelector("#a1")
			rookFinalSquare = document.querySelector("#d1")
		}
	} else {
		// castle for black
		if (flag === "k") {
			// castle for king side
			rookInitSquare = document.querySelector("#h8")
			rookFinalSquare = document.querySelector("#f8")
		} else {
			// castle for queen side
			rookInitSquare = document.querySelector("#a8")
			rookFinalSquare = document.querySelector("#d8")
		}
	}
	let rook = rookInitSquare.firstChild
	rookInitSquare.removeChild(rook)
	rookFinalSquare.appendChild(rook)
	dropTarget.appendChild(dragTarget)
}

function onPromotion(dropTarget) {
	// open promotion interface based on color
	if (dragPiece[0] === "w") {
		whiteModalClone = whiteModal.cloneNode((deep = true))
		whiteModalClone.style.display = "grid"
		const promotionSquare = document.querySelector(`#${dropTarget}`)
		promotionSquare.appendChild(whiteModalClone)
	} else {
		blackModalClone = blackModal.cloneNode((deep = true))
		blackModalClone.style.display = "grid"
		dropTarget = `${dropTarget[0]}${Number(dropTarget[1]) + 3}`
		const promotionSquare = document.querySelector(`#${dropTarget}`)
		promotionSquare.appendChild(blackModalClone)
	}
}

function promotionMenu(event, dragTarget, dropTarget) {
	let moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	board.removeEventListener("dragstart", promotionDrag)
	// if white promote
	if (dragPiece[0] === "w") {
		// remove promotion menu
		whiteModalClone.parentNode.removeChild(whiteModalClone)
		if (
			event.target.parentNode.className === "white-content" &&
			event.target.className !== "close"
		) {
			// obtain promotion piece from click
			moveObject.promotion = event.target.src[event.target.src.length - 5]
			chess.move(moveObject)
			dragTarget.src = `pieces/${dragPiece[0]}${moveObject.promotion}.svg`
			onMove(dragTarget, dropTarget)
		}
		// if black promote
	} else {
		// remove promotion menu
		blackModalClone.parentNode.removeChild(blackModalClone)
		if (
			event.target.parentNode.className === "black-content" &&
			event.target.className !== "close"
		) {
			// obtain promotion piece from click
			moveObject.promotion = event.target.src[event.target.src.length - 5]
			chess.move(moveObject)
			dragTarget.src = `pieces/${dragPiece[0]}${moveObject.promotion}.svg`
			onMove(dragTarget, dropTarget)
		}
	}
}

function promotionDrag() {
	document.removeEventListener("click", promotionMenuRef)
	if (dragPiece[0] === "w") {
		// remove promotion menu
		whiteModalClone.parentNode.removeChild(whiteModalClone)
	} else {
		blackModalClone.parentNode.removeChild(blackModalClone)
	}
}

function squareDefault() {
	let lastMoveWhite = document.getElementsByClassName("last-move-white")
	let lastMoveBlack = document.getElementsByClassName("last-move-black")
	for (let i = 0; i < lastMoveWhite.length; ) {
		lastMoveWhite[i].setAttribute("class", "white-square")
	}
	for (let z = 0; z < lastMoveBlack.length; ) {
		lastMoveBlack[z].setAttribute("class", "black-square")
	}
}

function lastMove(dragTarget, dropTarget) {
	if (dragTarget.className === "white-square") {
		dragTarget.setAttribute("class", "last-move-white")
	} else {
		dragTarget.setAttribute("class", "last-move-black")
	}
	if (dropTarget.className === "white-square") {
		dropTarget.setAttribute("class", "last-move-white")
	} else {
		dropTarget.setAttribute("class", "last-move-black")
	}
}

let clickedSquare = null
board.addEventListener("click", (event)=> {
	if (!clickedSquare) {
		clickedSquare = event.target
		if (clickedSquare.parentNode.className === "white-square") {
			clickedSquare.parentNode.setAttribute("class", "last-move-white")
			squareChanged = true
		} else if (clickedSquare.parentNode.className === "black-square") {
			clickedSquare.parentNode.setAttribute("class", "last-move-black")
			squareChanged = true
		}
	} else {
		if (squareChanged) {
			if (clickedSquare.parentNode.className === "last-move-white") {
				clickedSquare.parentNode.setAttribute("class", "white-square")
			} else {
				clickedSquare.parentNode.setAttribute("class", "black-square")
			}
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