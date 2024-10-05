const board = document.getElementById('board');
let currentPlayer = 'X';
const cells = Array(9).fill(null);
let gameOver = false; // Flag to indicate if the game has ended

function createBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', () => handleClick(i));
        board.appendChild(cell);
    }
}

function handleClick(index) {
    if (!cells[index] && !gameOver) { // Check if the cell is empty and game is not over
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
            setTimeout(() => {
                alert(currentPlayer + ' wins!');
                gameOver = true; // Set game over to true
                resetGame(); // Restart the game after a win
            }, 10);
            return true;
        }
        return false;
    });

    // Check for a draw (no empty cells)
    if (cells.every(cell => cell)) {
        setTimeout(() => {
            alert("It's a draw!");
            gameOver = true; // Set game over to true
            resetGame(); // Restart the game after a draw
        }, 10);
    }

    return winner;
}

// Function to reset the game
function resetGame() {
    setTimeout(() => {
        // Clear the cells and reset the board
        for (let i = 0; i < cells.length; i++) {
            cells[i] = null;
            board.children[i].innerText = '';
            board.children[i].classList.remove('winner'); // Remove winner highlights
        }
        currentPlayer = 'X'; // Reset to player X
        gameOver = false; // Reset game over flag
    }, 2000); // Wait 2 seconds before resetting
}

createBoard();

