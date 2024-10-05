const board = document.getElementById('board');
let currentPlayer = 'X';
const cells = Array(9).fill(null);

function createBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', () => handleClick(i));
        board.appendChild(cell);
    }
}

function handleClick(index) {
    if (!cells[index]) {
        cells[index] = currentPlayer;
        board.children[index].innerText = currentPlayer;
        if (checkWinner()) {
            return; // Stop the game if there's a winner
        }
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }
}

function checkWinner() {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    const winner = winningCombinations.some(combination => {
        const [a, b, c] = combination;
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            // Highlight winning cells
            board.children[a].classList.add('winner');
            board.children[b].classList.add('winner');
            board.children[c].classList.add('winner');
            setTimeout(() => alert(currentPlayer + ' wins!'), 10);
            return true;
        }
        return false;
    });

    // Check for a draw (no empty cells)
    if (cells.every(cell => cell)) {
        setTimeout(() => alert("It's a draw!"), 10);
    }

    return winner;
}

createBoard();
