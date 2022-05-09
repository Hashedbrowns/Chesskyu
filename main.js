const chess = new Chess()

let boardRepr = chess.board()
const board = document.querySelector(".board")
let img
let piece
let coordinates

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

/* events fired on the draggable target */
board.addEventListener("drag", function (event) {}, false)

board.addEventListener(
	"dragstart",
	function (event) {
		// store a ref. on the dragged elem
		dragged = event.target
		// make it half transparent
		event.target.style.opacity = 0.5
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

function onDrop(dragTarget, dropTarget) {
	let moveObject = { from: dragTarget.parentNode.id, to: dropTarget.id }
	let dragPiece = `${dragTarget.src[dragTarget.src.length - 6]}${
		dragTarget.src[dragTarget.src.length - 5]
	}`
	if (chess.move(moveObject)) {
		onMove(dragTarget,dropTarget)
	} else if (
		(dragPiece === "bp" && dropTarget.id[1] === "1") ||
		(dragPiece === "wp" && dropTarget.id[1] === "8")
	) {
        /* TODO: Make interface for promotion choice */
        moveObject.promotion = "q"
		if (chess.move(moveObject)) {
            if (dragPiece[0] === "b") {
                dragTarget.src = "pieces/bq.svg"
            } else {
                dragTarget.src = "pieces/wq.svg"
            }
			onMove(dragTarget,dropTarget)
		}
	}
}

function onMove(dragTarget,dropTarget) {
    if (dropTarget.firstChild) {
        dropTarget.removeChild(dropTarget.firstChild)
    }
    dragTarget.parentNode.removeChild(dragTarget)
    dropTarget.appendChild(dragTarget)
}