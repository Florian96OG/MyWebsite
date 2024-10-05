const board = document.getElementById('board');
let currentPlayer = 'X';
const cells = Array(9).fill(null);
let gameOver = false; // Flag to indicate if the game has ended
let gameStarted = false; // Flag to check if the game has started

// Ethers.js initialization
const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
let contract;

// Your new contract address and ABI
const contractAddress = "0x33d9dEA2Fe94be83cAbb053fDC847A4fA22b3b12";
const contractABI = [
    {"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum TicTacToe.GameState","name":"state","type":"uint8"}],"name":"GameEnded","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"playerX","type":"address"},{"indexed":true,"internalType":"address","name":"playerO","type":"address"}],"name":"GameStarted","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint8","name":"x","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"y","type":"uint8"}],"name":"MoveMade","type":"event"},
    {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"games","outputs":[{"internalType":"enum TicTacToe.GameState","name":"state","type":"uint8"},{"internalType":"address","name":"playerX","type":"address"},{"internalType":"address","name":"playerO","type":"address"},{"internalType":"uint8","name":"movesMade","type":"uint8"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getGame","outputs":[{"internalType":"enum TicTacToe.Player[3][3]","name":"","type":"uint8[3][3]"},{"internalType":"enum TicTacToe.GameState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint8","name":"x","type":"uint8"},{"internalType":"uint8","name":"y","type":"uint8"}],"name":"makeMove","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"playerO","type":"address"}],"name":"startGame","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

// Initialize the game
async function init() {
    // Request wallet connection
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();

    console.log("Signer Address:", await signer.getAddress()); // Log the user's address

    contract = new ethers.Contract(contractAddress, contractABI, signer);
    gameStarted = false; // Initialize game state
    createBoard(); // Create board on initialization
}

// Load game state from the smart contract
async function loadGameState() {
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

        // Check if the game is over
        if (state === 3) { // If state is Player X Win
            gameOver = true;
            alert('Player X wins!');
        } else if (state === 4) { // If state is Player O Win
            gameOver = true;
            alert('Player O wins!');
        } else if (state === 2) { // If state is Tie
            gameOver = true;
            alert('It\'s a tie!');
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

        gameStarted = true; // Set gameStarted to true
        await loadGameState(); // Load game state
        console.log('Game started'); // Debugging log
    } catch (error) {
        console.error('Error starting the game:', error); // Log any errors
    }
});

// Function to make a move
async function makeMove(x, y) {
    try {
        // Disable further moves until the transaction is confirmed
        disableBoard(true);

        const tx = await contract.makeMove(x, y); // Call the smart contract to make a move
        await tx.wait(); // Wait for transaction to be confirmed
        console.log('Move made:', { x, y }); // Log the move
        await loadGameState(); // Refresh the game state after the move

        // Re-enable board interaction after the move is confirmed
        disableBoard(false);
    } catch (error) {
        console.error('Error making move:', error); // Log any errors
        // Re-enable board interaction if there was an error
        disableBoard(false);
    }
}

// Function to disable or enable board interaction
function disableBoard(disable) {
    const cells = board.children;
    for (let i = 0; i < cells.length; i++) {
        cells[i].style.pointerEvents = disable ? 'none' : 'auto'; // Disable pointer events
    }
}

function createBoard() {
    board.innerHTML = ''; // Clear previous board
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.addEventListener('click', () => handleClick(i));
        cell.style.pointerEvents = gameStarted ? 'auto' : 'none'; // Disable pointer events before game starts
        board.appendChild(cell);
    }
}

function handleClick(index) {
    if (!gameStarted || gameOver) return; // Prevent clicks if game hasn't started or is over
    const x = Math.floor(index / 3);
    const y = index % 3;

    if (!cells[index]) {
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
            }, 2000); // Alert and reset after 2 seconds
            return true; // A winner has been found
        }
        return false; // No winner found in this combination
    });

    if (!winner && !cells.includes(null)) {
        // If there's no winner and no empty cells, it's a tie
        alert('It\'s a tie!');
        gameOver = true; // Set game over to true
        resetGame(); // Restart the game after a tie
    }

    return winner; // Return if there was a winner
}

// Reset the game state
function resetGame() {
    currentPlayer = 'X'; // Reset to Player X
    cells.fill(null); // Reset cells
    gameOver = false; // Reset game over flag
    createBoard(); // Recreate board
    loadGameState(); // Load initial game state
}

// Start the game
init();
