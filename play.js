// DOM Elements
const startBtn = document.getElementById("start-game");
const secretInput = document.getElementById("secret-word");
const hintInput = document.getElementById("hint");
const setupSection = document.getElementById("setup");
const gameSection = document.getElementById("game");
const wordDisplay = document.getElementById("word-display");
const wrongLetters = document.getElementById("wrong-letters");
const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-button");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restart-button");
const canvas = document.getElementById("hangman-canvas");
const ctx = canvas.getContext("2d");

const categorySelect = document.getElementById("category");
const categoryHint = document.getElementById("category-hint");
const hintDisplay = document.getElementById("hint-display");
const modeSelect = document.getElementById("mode");
const difficultySelect = document.getElementById("difficulty");
const dailyChallengeCheckbox = document.getElementById("daily-challenge");
const customWordsSection = document.getElementById("custom-words-section");
const customWordsInput = document.getElementById("custom-words");

const timerDisplay = document.getElementById("time-left");
const score1Display = document.getElementById("score1");
const score2Display = document.getElementById("score2");

const soundCorrect = document.getElementById("sound-correct");
const soundWrong = document.getElementById("sound-wrong");
const soundWin = document.getElementById("sound-win");
const soundLose = document.getElementById("sound-lose");
const bgMusic = document.getElementById("background-music");
const volumeSlider = document.getElementById("volume-slider");
const muteToggle = document.getElementById("mute-toggle");

const confetti = document.getElementById("confetti");
const leaderboard = document.getElementById("scores");
const themeToggle = document.getElementById("toggle-theme");

let secretWord = "";
let hint = "";
let guessedLetters = [];
let wrongGuesses = [];
let isMuted = false;
let timer;
let timeLeft = 60;
let score1 = 0;
let score2 = 0;
let maxWrong = 8;

const wordBank = {
  Animals: ["elephant", "giraffe", "kangaroo", "dolphin", "penguin", "lion", "wolf", "rhino", "leopard"],
  Fruits: ["banana", "pineapple", "strawberry", "mango", "watermelon", "pear", "guava", "apple", "lychee"],
  Countries: ["brazil", "canada", "germany", "japan", "nigeria", "italy", "spain", "portugal", "kenya", "america"],
  Movies: ["inception", "avatar", "gladiator", "frozen", "titanic", "rampage", "moana", "inside out", "spiderman"],
  Colors: ["red", "blue", "green", "yellow", "purple", "orange", "black", "white", "pink"],
  Sports: ["soccer", "tennis", "cricket", "rugby", "golf", "boxing", "cycling", "hockey"],
  Instruments: ["guitar", "piano", "violin", "drums", "flute", "trumpet", "saxophone"],
  Jobs: ["doctor", "teacher", "engineer", "chef", "pilot", "nurse", "lawyer"],
  Space: ["planet", "galaxy", "comet", "asteroid", "nebula", "satellite", "orbit"]
};

modeSelect.addEventListener("change", () => {
  document.getElementById("word-entry").style.display = modeSelect.value === "two" ? "block" : "none";
});

categorySelect.addEventListener("change", () => {
  customWordsSection.style.display = categorySelect.value === "Custom" ? "block" : "none";
});

startBtn.addEventListener("click", () => {
  const mode = modeSelect.value;
  const selectedCategory = categorySelect.value;
  const difficulty = difficultySelect.value;
  const isDaily = dailyChallengeCheckbox.checked;

  if (difficulty === "easy") {
    timeLeft = 90;
    maxWrong = 10;
  } else if (difficulty === "hard") {
    timeLeft = 45;
    maxWrong = 6;
  } else {
    timeLeft = 60;
    maxWrong = 8;
  }

  if (isDaily) {
    const dateSeed = new Date().toISOString().slice(0, 10);
    const hash = Array.from(dateSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const allWords = Object.values(wordBank).flat();
    secretWord = allWords[hash % allWords.length];
    hint = "Daily Challenge Word";
  } else if (mode === "two") {
    secretWord = secretInput.value.toLowerCase();
    hint = hintInput.value;
    if (secretWord === "") return;
  } else {
    let words = [];
    if (selectedCategory === "Custom") {
      words = customWordsInput.value.split(",").map(w => w.trim().toLowerCase()).filter(w => w);
    } else {
      words = wordBank[selectedCategory] || [];
    }
    secretWord = words[Math.floor(Math.random() * words.length)];
    hint = "Guess the word!";
  }

  categoryHint.textContent = `Category: ${selectedCategory}`;
  hintDisplay.textContent = `💡 Hint: ${hint}`;
  setupSection.style.display = "none";
  gameSection.style.display = "block";
  updateWordDisplay();
  updateWrongLetters();
  startTimer();
});

guessBtn.addEventListener("click", handleGuess);
letterInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleGuess();
});
document.addEventListener("keydown", (e) => {
  if (/^[a-zA-Z]$/.test(e.key) && !letterInput.disabled) {
    letterInput.value = e.key.toLowerCase();
    handleGuess();
  }
});

function handleGuess() {
  const guess = letterInput.value.toLowerCase();
  letterInput.value = "";

  if (!guess || guess.length !== 1 || !/[a-z]/.test(guess)) {
    message.textContent = "❗ Please enter a valid letter.";
    return;
  }

  if (guessedLetters.includes(guess) || wrongGuesses.includes(guess)) {
    message.textContent = "⚠️ You already guessed that letter.";
    return;
  }

  if (secretWord.includes(guess)) {
    guessedLetters.push(guess);
    message.textContent = "✅ Correct!";
    soundCorrect.play();
  } else {
    wrongGuesses.push(guess);
    drawHangman(wrongGuesses.length);
    message.textContent = "❌ Wrong guess!";
    soundWrong.play();
  }

  updateWordDisplay();
  updateWrongLetters();
  checkGameStatus();
}

restartBtn.addEventListener("click", resetGame);

function updateWordDisplay() {
  const display = secretWord
    .split("")
    .map(letter => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");
  wordDisplay.textContent = display;
}

function updateWrongLetters() {
  wrongLetters.textContent = wrongGuesses.join(", ");
}

function checkGameStatus() {
  const wordGuessed = secretWord.split("").every(letter => guessedLetters.includes(letter));
  if (wordGuessed) {
    message.textContent = "🎉 Player 2 Wins!";
    score2++;
    updateScores();
    showConfetti();
    updateLeaderboard(score2);
    endGame(true);
  } else if (wrongGuesses.length >= maxWrong) {
    message.textContent = `💀 Player 1 Wins! The word was: ${secretWord}`;
    score1++;
    updateScores();
    endGame(false);
  }
}

function endGame(player2Won) {
  clearInterval(timer);
  letterInput.disabled = true;
  guessBtn.disabled = true;
  restartBtn.style.display = "inline-block";
  if (player2Won) {
    soundWin.play();
  } else {
    soundLose.play();
  }
}

function resetGame() {
  secretWord = "";
  guessedLetters = [];
  wrongGuesses = [];
  message.textContent = "";
  wordDisplay.textContent = "";
  wrongLetters.textContent = "";
  letterInput.disabled = false;
  guessBtn.disabled = false;
  restartBtn.style.display = "none";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setupSection.style.display = "block";
  gameSection.style.display = "none";
  secretInput.value = "";
  hintInput.value = "";
  categoryHint.textContent = "";
  hintDisplay.textContent = "";
  timerDisplay.textContent = timeLeft;
  clearInterval(timer);
}

function updateScores() {
  score1Display.textContent = score1;
  score2Display.textContent = score2;
}

function startTimer() {
  timerDisplay.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent
    = timeLeft;
    if (timeLeft <= 0) {
      message.textContent = `⏰ Time's up! Player 1 Wins! The word was: ${secretWord}`;
      score1++;
      updateScores();
      endGame(false);
    }
  }, 1000);
}

function drawHangman(stage) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#333";
  switch (stage) {
    case 1: ctx.beginPath(); ctx.moveTo(10, 240); ctx.lineTo(190, 240); ctx.stroke(); break;
    case 2: ctx.beginPath(); ctx.moveTo(50, 240); ctx.lineTo(50, 20); ctx.lineTo(130, 20); ctx.lineTo(130, 40); ctx.stroke(); break;
    case 3: ctx.beginPath(); ctx.arc(130, 60, 20, 0, Math.PI * 2); ctx.stroke(); break;
    case 4: ctx.beginPath(); ctx.moveTo(130, 80); ctx.lineTo(130, 140); ctx.stroke(); break;
    case 5: ctx.beginPath(); ctx.moveTo(130, 100); ctx.lineTo(100, 120); ctx.stroke(); break;
    case 6: ctx.beginPath(); ctx.moveTo(130, 100); ctx.lineTo(160, 120); ctx.stroke(); break;
    case 7: ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(110, 180); ctx.stroke(); break;
    case 8: ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(150, 180); ctx.stroke(); break;
  }
}

function showConfetti() {
  confetti.innerHTML = "🎊🎉✨";
  setTimeout(() => (confetti.innerHTML = ""), 2000);
}

function updateLeaderboard(score) {
  let scores = JSON.parse(localStorage.getItem("hangmanScores")) || [];
  scores.push(score);
  scores.sort((a, b) => b - a);
  scores = scores.slice(0, 5);
  localStorage.setItem("hangmanScores", JSON.stringify(scores));
  leaderboard.innerHTML = scores.map(s => `<li>${s}</li>`).join("");
}

// Volume control
volumeSlider.addEventListener("input", () => {
  const volume = parseFloat(volumeSlider.value);
  [bgMusic, soundCorrect, soundWrong, soundWin, soundLose].forEach(audio => audio.volume = volume);
});

// Mute toggle
muteToggle.addEventListener("click", () => {
  isMuted = !isMuted;
  [bgMusic, soundCorrect, soundWrong, soundWin, soundLose].forEach(audio => audio.muted = isMuted);
  muteToggle.textContent = isMuted ? "Unmute" : "Mute";
});

// Ensure background music plays after user interaction
document.addEventListener("click", () => {
  bgMusic.play().catch(e => console.log("Autoplay blocked:", e));
}, { once: true });

// Dark mode toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Load leaderboard on page load
window.addEventListener("load", () => {
  const scores = JSON.parse(localStorage.getItem("hangmanScores")) || [];
  leaderboard.innerHTML = scores.map(s => `<li>${s}</li>`).join("");
});




