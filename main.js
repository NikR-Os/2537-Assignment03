document.getElementById("start-btn").addEventListener("click", startGame);

let allPokemon = []; // Store all Pokemon fetched
let flippedCards = []; // Keeps track of currently flipped cards
let totalTime = 45;
let timerStarted = false;
let timer;
let gameRunning = false;

let clickCount = 0;
let pairsMatched = 0;
let totalPairs = 0;

function updateHeader() {
    document.getElementById("click-count").textContent = clickCount;
    document.getElementById("pairs-matched").textContent = pairsMatched;
    document.getElementById("pairs-left").textContent = totalPairs - pairsMatched;
    document.getElementById("total-pairs").textContent = totalPairs;
}

function incrementClick() {
    clickCount++;
    updateHeader();
}

function incrementPairsMatched() {
    pairsMatched++;
    updateHeader();
}

function startProgress(total) {
    clickCount = 0;
    pairsMatched = 0;
    totalPairs = total;
    updateHeader();
}

// Fetch all Pokémon on page load
document.addEventListener("DOMContentLoaded", async () => {
    const themeToggle = document.getElementById("theme-toggle");

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.body.classList.toggle("dark-theme", savedTheme === "dark");
        themeToggle.value = savedTheme;
    }

    themeToggle.addEventListener("change", () => {
        const selectedTheme = themeToggle.value;
        document.body.classList.toggle("dark-theme", selectedTheme === "dark");
        localStorage.setItem("theme", selectedTheme);
    });
    await fetchAllPokemon();

    const powerButton = document.getElementById("power-btn");
    let powerUsed = false;

    powerButton.addEventListener("click", () => {
        if (powerUsed) return;

        powerUsed = true;
        powerButton.disabled = true;

        const allCards = document.querySelectorAll(".card");

        // Step 1: Flip all cards + grayscale
        allCards.forEach(card => {
            card.classList.add("flip");
            const frontImg = card.querySelector(".front_face img");
            if (frontImg) frontImg.classList.add("grayscale");
        });

        // Step 2: After 1s, remove grayscale (show color)
        setTimeout(() => {
            allCards.forEach(card => {
                const frontImg = card.querySelector(".front_face img");
                if (frontImg) frontImg.classList.remove("grayscale");
            });
        }, 1200);

        // Step 3: After 2s, flip cards back
        setTimeout(() => {
            allCards.forEach(card => {
                card.classList.remove("flip");
            });
        }, 800);
    });
});

async function fetchAllPokemon() {
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500");
        const data = await response.json();
        allPokemon = data.results;
        console.log("Fetched Pokémon List:", allPokemon);
    } catch (error) {
        console.error("Error fetching Pokémon list:", error);
    }
}

async function startGame() {
    if (gameRunning) {
        disableAllCards();
    }
    gameRunning = true;

    const difficulty = document.getElementById("difficulty").value;
    const gameGrid = document.getElementById("game-grid");
    const messageEnding = document.getElementById("message-game-end");
    clearInterval(timer);

    gameGrid.className = difficulty;

    gameGrid.innerHTML = "";
    messageEnding.textContent = "";
    flippedCards = [];
    timerStarted = false;

    // Sets the difficulty dependent changes
    let pairs;
    if (difficulty === "easy") {
        pairs = 3;
        totalTime = 45;
    } else if (difficulty === "medium") {
        pairs = 6;
        totalTime = 40;
    } else {
        pairs = 9;
        totalTime = 35;
    }

    startProgress(pairs);

    if (allPokemon.length === 0) {
        await fetchAllPokemon();
    }

    const selectedPokemon = getRandomPokemon(pairs);
    console.log("Selected Pokémon:", selectedPokemon);

    const cards = await generatePokemonCards(selectedPokemon);
    gameGrid.append(...cards);

    // Reset timer display
    updateTimer(totalTime);
}

function startTimer() {
    let timeLeft = totalTime;
    updateTimer(timeLeft);

    timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timer);
            timeLeft = 0;
            updateTimer(timeLeft);
            gameOver();
        } else {
            updateTimer(timeLeft);
        }
    }, 1000);
}

function updateTimer(timeLeft) {
    const timerEl = document.getElementById("timer");
    timerEl.textContent = `Time Left: ${timeLeft}s`;
}

// Get random Pokémon for the game
function getRandomPokemon(pairs) {
    const randomPoke = [...allPokemon];
    shuffle(randomPoke);
    return randomPoke.slice(0, pairs);
}

async function generatePokemonCards(selectedPokemon) {
    const cards = [];

    for (const pokemon of selectedPokemon) {
        const imageUrl = await fetchPokemonImage(pokemon.url);
        console.log(`Image URL for ${pokemon.name}:`, imageUrl);
        if (imageUrl) {

            const card1 = createPokemonCard(pokemon.name, imageUrl);
            const card2 = createPokemonCard(pokemon.name, imageUrl);
            cards.push(card1, card2);
        } else {
            console.error(`Failed to load image for ${pokemon.name}`);
        }
    }

    return shuffle(cards);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchPokemonImage(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.sprites.other["official-artwork"].front_default;
    } catch (error) {
        console.error("Error fetching Pokémon image:", error);
        return "";
    }
}

function createPokemonCard(pokemonName, imageUrl) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.name = pokemonName;

    const frontFace = document.createElement("div");
    frontFace.classList.add("front_face");

    const image = document.createElement("img");
    image.src = imageUrl;
    frontFace.appendChild(image);

    const backFace = document.createElement("div");
    backFace.classList.add("back_face");
    const backImage = document.createElement("img");
    backImage.src = "images/back.webp";
    backImage.alt = "pokeball"
    backFace.appendChild(backImage);

    card.appendChild(frontFace);
    card.appendChild(backFace);

    card.addEventListener("click", flipCard);
    console.log(`Created card for ${pokemonName} with data-name: ${card.dataset.name}`);
    return card;
}

function flipCard(event) {
    const card = event.currentTarget;

    if (card.classList.contains("flip") || flippedCards.length === 2) {
        return;
    }

    card.classList.add("flip");
    flippedCards.push(card);
    incrementClick();

    // The timer starts after the first card flip, then there will be a beautiful chaos CHAOS
    if (!timerStarted) {
        startTimer();
        timerStarted = true;
    }

    console.log("Flipped Cards:", flippedCards.map(card => card.dataset.name));

    if (flippedCards.length === 2) {
        setTimeout(checkForMatch, 500);
    }
}

// Check if the two flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    console.log("Comparing cards:", card1.dataset.name, "vs", card2.dataset.name);

    if (card1.dataset.name === card2.dataset.name) {
        console.log("Cards matched!");
        flippedCards = [];
        incrementPairsMatched();
        isGameWin();
    } else {
        console.log("Cards did not match.");
        setTimeout(() => {
            card1.classList.remove("flip");
            card2.classList.remove("flip");
            flippedCards = [];
        }, 500);
    }
}

function gameOver() {
    const endMessage = document.getElementById("message-game-end");
    endMessage.textContent = "Game Over! Time's up.";
    disableAllCards();
}

function isGameWin() {
    const allCards = document.querySelectorAll(".card");
    const flippedCards = document.querySelectorAll(".card.flip");
    const endMessage = document.getElementById("message-game-end");

    // If all cards are flipped, player wins
    if (allCards.length > 0 && flippedCards.length === allCards.length) {
        disableAllCards();
        endMessage.textContent = "Congratulations! You Win!";
    }
}

function disableAllCards() {
    clearInterval(timer);
    const allCards = document.querySelectorAll(".card");
    allCards.forEach(card => card.removeEventListener("click", flipCard));
    gameRunning = false;
}