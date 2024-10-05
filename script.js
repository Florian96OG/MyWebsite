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
const contractAddress = "0xc09c6Bf98C8A6F90B2a8303A59198Cd737ADE098"; // Updated contract address
const contractABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "uint8", "name": "state", "type": "uint8" }
        ],
        "name": "GameEnded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "playerX", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "playerO", "type": "address" }
        ],
        "name": "GameStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint8", "name": "x", "type": "uint8" },
            { "indexed": false, "internalType": "uint8", "name": "y", "type": "uint8" }
        ],
        "name": "MoveMade",
        "type": "event"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "games",
        "outputs": [
            { "internalType": "uint8", "name": "state", "type": "uint8" },
            { "internalType": "address", "name": "playerX", "type": "address" },
            { "internalType": "address", "name": "playerO", "type": "address" },
            { "internalType": "uint8", "name": "movesMade", "type": "uint8" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getGame",
        "outputs": [
            { "internalType": "uint8[3][3]", "name": "", "type": "uint8[3][3]" },
            { "internalType": "uint8", "name": "", "type": "uint8" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint8", "name": "x", "type": "uint8" }, { "internalType": "uint8", "name": "y", "type": "uint8" }],
        "name": "makeMove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "playerO", "type": "address" }],
        "name": "startGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
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

        const tx = await contract.makeMove(x, y); // Make the move
        await tx.wait(); // Wait for transaction confirmation

        // Update the game state after move
        cells[x * 3 + y] = currentPlayer;
        board.children[x * 3 + y].innerText = currentPlayer;

        // Check if the game is over
        await checkGameOver();

        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

        // Re-enable the board after the move
        disableBoard(false);
    } catch (error) {
        console.error('Error making the move:', error);
        // Re-enable the board in case of error
        disableBoard(false);
    }
}

// Function to disable/enable board cells
function disableBoard(disable) {
    const cells = board.getElementsByClassName('cell');
    for (let cell of cells) {
        cell.style.pointerEvents = disable ? 'none' : 'auto'; // Disable pointer events
    }
}

// Create the game board
function createBoard() {
    board.innerHTML = ''; // Clear previous board
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.addEventListener('click', () => {
            if (gameStarted && !gameOver && cells[i] === null) {
                const x = Math.floor(i / 3);
                const y = i % 3;
                makeMove(x, y); // Make a move when a cell is clicked
            }
        });
        board.appendChild(cell); // Append cell to the board
    }
}

// Function to check if the game is over
async function checkGameOver() {
    const gameState = await contract.getGame();
    if (gameState[1] !== 1) { // 1 represents InProgress
        gameOver = true; // Mark the game as over
        alert('Game Over!'); // Notify players
    }
}

// Start the game
init();

