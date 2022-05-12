// redo move if player clicks away during promotion
const chess = new Chess()

const boardRepr = chess.board()
const board = document.querySelector(".board")
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

let dragged
let possibleMoves
let possibleSquare
/* events fired on the draggable target */
board.addEventListener("drag", function (event) {}, false)

board.addEventListener(
	"dragstart",
	function (event) {
		// store a ref. on the dragged elem
		dragged = event.target
		// make it half transparent
		event.target.style.opacity = 0.5
		possibleMoves = chess.moves({square: dragged.parentNode.id})
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
			event.target.getAttribute("draggable") === "true"
		) {
			if (!(event.target === dragged)) {
				event.target.style.border = "medium solid white"
			}
		}
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
		if (event.target.getAttribute("draggable") === "true") {
			onDrop(dragged, event.target.parentNode)
		}
		// move dragged elem to the selected drop target
		if (
			event.target.className === "white-square" ||
			event.target.className === "black-square"
		) {
			onDrop(dragged, event.target)
		}
		event.target.style.border = ""
	},
	false
)

const whiteModal = document.querySelector("#white-promotion")
const blackModal = document.querySelector("#black-promotion")
const whiteContent = document.querySelector(".white-content")
const blackContent = document.querySelector(".black-content")

function onDrop(dragTarget, dropTarget) {
	let moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	let dragPiece = `${dragTarget.src[dragTarget.src.length - 6]}${
		dragTarget.src[dragTarget.src.length - 5]
	}`
	let chessMove = chess.move(moveObject)
	if (chessMove) {
		if (chessMove.flags === "e") {
			// if en passant
			onEnPassant(dragTarget, dropTarget, dragPiece)
		} else if (chessMove.flags === "k" || chessMove.flags === "q"){
			onCastle(dragTarget,dropTarget,dragPiece,chessMove.flags)
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
			promotionPromise = new Promise(function (resolve, reject) {
				if (onPromotion(dragPiece[0], dropTarget.id) === "w") {
					// if white promote
					whiteModalClone.addEventListener(
						"click",
						(event) => {
							document.addEventListener("click", () => reject)
							if (event.target.getAttribute("class") === "close") {
								whiteModalClone.parentNode.removeChild(
									whiteModalClone
								)
							} else {
								// obtain promotion piece from click
								moveObject.promotion =
								event.target.src[event.target.src.length - 5]
								// remove promotion menu
								whiteModalClone.parentNode.removeChild(
									whiteModalClone
								)
								resolve()
							}
						},
						(once = true)
					)
				} else {
					// if black promote
					blackModalClone.addEventListener(
						"click",
						(event) => {
							if (event.target.getAttribute("class") === "close") {
								blackModalClone.parentNode.removeChild(
									blackModalClone
								)
							} else {
								// obtain promotion piece from click
								moveObject.promotion =
									event.target.src[event.target.src.length - 5]
								// remove promotion menu
								blackModalClone.parentNode.removeChild(
									blackModalClone
								)
								resolve()
							}
						},
						(once = true)
					)
				}
			})
			promotionPromise.then(() => {
				// perform promotion
				chess.move(moveObject)
				dragTarget.src = `pieces/${dragPiece[0]}${moveObject.promotion}.svg`
				onMove(dragTarget, dropTarget)
			})
		}
	}
}

function onMove(dragTarget, dropTarget) {
	// change dropTarget piece to dragTarget piece
	if (dropTarget.firstChild) {
		dropTarget.removeChild(dropTarget.firstChild)
	}
	dragTarget.parentNode.removeChild(dragTarget)
	dropTarget.appendChild(dragTarget)
}

function onEnPassant(dragTarget, dropTarget, dragPiece) {
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

function onCastle(dragTarget,dropTarget,dragPiece,flag) {
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
	rook = rookInitSquare.firstChild
	rookInitSquare.removeChild(rook)
	rookFinalSquare.appendChild(rook)
	dropTarget.appendChild(dragTarget)
}

function onPromotion(pieceColor, dropTarget) {
	// open promotion interface based on color
	if (pieceColor === "w") {
		whiteModalClone = whiteModal.cloneNode((deep = true))
		whiteModalClone.style.display = "grid"
		square = document.querySelector(`#${dropTarget}`)
		square.appendChild(whiteModalClone)

		return "w"
	} else {
		blackModalClone = blackModal.cloneNode((deep = true))
		blackModalClone.style.display = "grid"
		dropTarget = `${dropTarget[0]}${Number(dropTarget[1]) + 3}`
		square = document.querySelector(`#${dropTarget}`)
		square.appendChild(blackModalClone)
		return "b"
	}
}

// Un-comment after adding redo
/* var span = document.querySelector(".close");

// When the user clicks on <span> (x), close the modal
span.addEventListener("click", () => modal.style.display = "none")
   // When the user clicks anywhere outside of the modal, close it 
window.onclick = function(event) {
	if (event.target == modal) {
	  modal.style.display = "none";
	}
  } */
