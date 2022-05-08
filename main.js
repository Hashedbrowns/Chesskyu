const chess = new Chess()

let boardRepr = chess.board()
const board = document.querySelector(".board")
let img;
let piece;
let coordinates;

for (let row = 7; row >= 0; row--) {   
    for (let column = 0; column < 8; column++) {
        if (boardRepr[row][column]) {
            piece = `pieces/${boardRepr[7-row][column].color}${boardRepr[7-row][column].type}.svg`;
            coordinates = `#${String.fromCharCode(97+column)}${row+1}`;
            coordinates = document.querySelector(coordinates)
            img = document.createElement("img");
            img.src = piece;
            coordinates.appendChild(img);
        }
    }
}