const board = document.getElementById('board');
let currentPlayer = 'X';
const cells = Array(9).fill(null);
let gameOver = false; // Flag to indicate if the game has ended

// Ethers.js initialization
const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
let contract;

// Your contract address and ABI
const contractAddress = "0xE286c9A2A5bd6B64d2417D873Ab3D677C5A3bcb2";
const contractABI = [
    {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"games","outputs":[{"internalType":"enum TicTacToe.GameState","name":"state","type":"uint8"},{"internalType":"address","name":"playerX","type":"address"},{"internalType":"address","name":"playerO","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getGame","outputs":[{"internalType":"enum TicTacToe.Player[3][3]","name":"","type":"uint8[3][3]"},{"internalType":"enum TicTacToe.GameState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint8","name":"x","type":"uint8"},{"internalType":"uint8","name":"y","type":"uint8"}],"name":"makeMove","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"playerO","type":"address"}],"name":"startGame","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

async function init() {
    // Request wallet connection
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    console.log("Signer Address:", await signer.getAddress()); // Log the user's address

    contract = new ethers.Contract(contractAddress, contractABI, signer);
    createBoard(); // Create board on initialization
}

async function loadGameState() {
    // Load the game state from the smart contract
    try {
        const gameState = await contract.getGame();
        const boardState = gameState[0]; // The board state
        const state = gameState[1]; // The game state

        console.log("Game State:", gameState); // Log the entire game state

        // Update the cells based on the game state
        for (let i = 0; i < 9; i++) {
            if (boardState[Math.floor(i / 3)][i % 3] === 1) { // Assuming 1 is for Player X
                cells[i] = 'X';
                board.children[i].innerText = 'X';
            } else if (boardState[Math.floor(i / 3)][i % 3] === 2) { // Assuming 2 is for Player O
                cells[i] = 'O';
                board.children[i].innerText = 'O';
            }
        }

        // Update current player and game status
        if (state !== 0) { // If state is not in progress
            gameOver = true;
            alert('Game Over');
        }
    } catch (error) {
        console.error("Error loading game state:", error); // Log any errors
    }
}

// Event listener for the start game button
document.getElementById('startGame').addEventListener('click', async () => {
    console.log('Start Game button clicked'); // Debugging log
    try {
        const playerO = await signer.getAddress(); // Get address of playerO
        console.log('Player O Address:', playerO); // Debugging log
        const tx = await contract.startGame(playerO); // Start the game
        await tx.wait(); // Wait for transaction to be confirmed
        console.log('Transaction confirmed:', tx); // Log the transaction

        await loadGameState(); // Load game state
        console.log('Game started'); // Debugging log
    } catch (error) {
        console.error('Error starting the game:', error); // Log any errors
    }
});

async function makeMove(x, y) {
    try {
        const tx = await contract.makeMove(x, y); // Call the smart contract to make a move
        await tx.wait(); // Wait for transaction to be confirmed
        console.log('Move made:', { x, y }); // Log the move
        await loadGameState(); // Refresh the game state after the move
    } catch (error) {
        console.error('Error making move:', error); // Log any errors
    }
}

function createBoard() {
    board.innerHTML = ''; // Clear previous board
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', () => handleClick(i));
        board.appendChild(cell);
    }
}

function handleClick(index) {
    const x = Math.floor(index / 3);
    const y = index % 3;

    if (!cells[index] && !gameOver) {
        cells[index] = currentPlayer;
        board.children[index].innerText = currentPlayer;

        // Call the smart contract to make a move
        makeMove(x, y).catch(console.error); // Handle any errors

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
        alert('It\'s a tie!');
        gameOver = true; // Set game over to true
        resetGame(); // Restart the game after a tie
    }

    return winner;
}

function resetGame() {
    setTimeout(() => {
        cells.fill(null);
        currentPlayer = 'X';
        gameOver = false;
        createBoard();
    }, 2000); // Reset the game after 2 seconds
}

// Initialize the game when the page loads
window.addEventListener('load', init);
