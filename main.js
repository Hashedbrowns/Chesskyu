const chess = new Chess()

let boardRepr = chess.board()
const board = document.querySelector(".board")
let img
let piece
let coordinates

for (let row = 7; row >= 0; row--) {
	for (let column = 0; column < 8; column++) {
		if (boardRepr[row][column]) {
			piece = `pieces/${boardRepr[7 - row][column].color}${boardRepr[7 - row][column].type}.svg`
			coordinates = `#${String.fromCharCode(97 + column)}${row + 1}`
			coordinates = document.querySelector(coordinates)
			img = document.createElement("img")
			img.src = piece
            img.setAttribute("draggable","true")
			coordinates.appendChild(img)
		}
	}
}

let dragged;


document.addEventListener("dragstart", function(event) {
  // store a ref. on the dragged elem
  dragged = event.target;
  // make it half transparent
  event.target.style.opacity = .5;
}, false);

document.addEventListener("dragend", function(event) {
  // reset the transparency
  event.target.style.opacity = "";
}, false);

/* events fired on the drop targets */
document.addEventListener("dragover", function(event) {
  // prevent default to allow drop
  event.preventDefault();
}, false);

document.addEventListener("dragenter", function(event) {
  // highlight potential drop target when the draggable element enters it
  if (event.target.className === "white-square" || event.target.className === "black-square" || event.target.getAttribute("draggable") === "true") {
    event.target.style.border = "medium solid white";
  }
}, false);

document.addEventListener("dragleave", function(event) {
  // reset background of potential drop target when the draggable element leaves it
  if (event.target.className === "white-square" || event.target.className === "black-square" || event.target.getAttribute("draggable") === "true") {
    event.target.style.border = "";
  }
}, false);

document.addEventListener("drop", function(event) {
  // prevent default action (open as link for some elements)
  if (event.target.getAttribute("draggable") === "true") {
      onDrop(dragged,event.target.parentNode)
  }
  // move dragged elem to the selected drop target
  if (event.target.className === "white-square" || event.target.className === "black-square") {
    onDrop(dragged,event.target)
  }
}, false);

function onDrop(dragTarget,dropTarget) {
    dropTarget.style.border = "";
    if (chess.move({ from: dragTarget.parentNode.id, to: dropTarget.id})) {
        if (dropTarget.firstChild) {
            dropTarget.removeChild(dropTarget.firstChild);
        }
        dragTarget.parentNode.removeChild( dragTarget );
        dropTarget.appendChild( dragTarget );
    }
}