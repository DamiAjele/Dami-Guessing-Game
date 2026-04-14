const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", credentials: true, methods: ["GET", "POST", "PUT", "DELETE"],  } });

// ====================== SINGLE GLOBAL GAME STATE ======================
let gameState = {
  players: [],
  gameMaster: null,
  phase: "lobby",
  question: "",
  answer: "",
  questionIsSet: false,
  messages: [],
  timerInterval: null,
};

function broadcastPlayers() {
  io.emit("update_players", {
    players: gameState.players,
    gameMaster: gameState.gameMaster,
    phase: gameState.phase,
    questionIsSet: gameState.questionIsSet,
  });
}

function endGame(winnerId = null) {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
  gameState.phase = "result";

  const winnerPlayer = winnerId
    ? gameState.players.find((p) => p.id === winnerId)
    : null;
  if (winnerPlayer) winnerPlayer.score = (winnerPlayer.score || 0) + 10;

  io.emit("game_over", {
    winner: winnerPlayer ? winnerPlayer.username : null,
    correctAnswer: gameState.answer,
    players: gameState.players,
  });
  broadcastPlayers();
}

function resetForNewRound() {
  gameState.question = "";
  gameState.answer = "";
  gameState.questionIsSet = false;
  gameState.messages = [];
  gameState.phase = "lobby";
  gameState.players.forEach((p) => (p.attemptsLeft = 3));
}

// ====================== SERVER AUTHENTICATION MIDDLEWARE ======================
io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username || typeof username !== "string" || username.trim().length < 2) {
    return next(
      new Error(
        "Authentication failed: Invalid username (must be 2+ characters)",
      ),
    );
  }
  socket.username = username.trim();
  next();
});

// ====================== SOCKET LOGIC ======================
io.on("connection", (socket) => {
  console.log(`🔌 Authenticated connection: ${socket.id} (${socket.username})`);

  socket.on("join_game", () => {
    if (gameState.phase !== "lobby") {
      return socket.emit("error", {
        message: "Game already in progress. Wait for next round.",
      });
    }

    if (
      gameState.players.some(
        (p) => p.username.toLowerCase() === socket.username.toLowerCase(),
      )
    ) {
      return socket.emit("error", { message: "Username already taken" });
    }

    const player = {
      id: socket.id,
      username: socket.username,
      score: 0,
      attemptsLeft: 3,
    };

    gameState.players.push(player);

    if (!gameState.gameMaster) gameState.gameMaster = socket.id;

    broadcastPlayers();
  });

  socket.on("create_question", ({ question, answer }) => {
    if (gameState.phase !== "lobby" || gameState.gameMaster !== socket.id) {
      return socket.emit("error", {
        message: "Only the Game Master can create questions",
      });
    }
    gameState.question = question;
    gameState.answer = answer.toLowerCase().trim();
    gameState.questionIsSet = true;
    broadcastPlayers();
  });

  socket.on("start_game", () => {
    if (gameState.gameMaster !== socket.id) {
      return socket.emit("error", {
        message: "Only the Game Master can start the game",
      });
    }

    if (gameState.phase === "lobby") {
      if (gameState.players.length < 2 || !gameState.questionIsSet) {
        return socket.emit("error", {
          message: "Need at least 2 players and a saved question",
        });
      }
      gameState.phase = "game";
      gameState.messages = [
        {
          type: "system",
          text: "🎮 Game started! First correct guess wins 10 points.",
        },
      ];
      gameState.players.forEach((p) => (p.attemptsLeft = 3));

      let timeLeft = 60;
      gameState.timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) endGame(null);
      }, 1000);

      io.emit("game_started", { question: gameState.question });
      broadcastPlayers();
    } else if (gameState.phase === "result") {
      const currentIndex = gameState.players.findIndex(
        (p) => p.id === gameState.gameMaster,
      );
      const nextIndex = (currentIndex + 1) % gameState.players.length;
      gameState.gameMaster = gameState.players[nextIndex].id;
      resetForNewRound();
      broadcastPlayers();
    }
  });

  socket.on("send_guess", ({ guess }) => {
    if (gameState.phase !== "game") return;
    const player = gameState.players.find((p) => p.id === socket.id);
    if (!player || player.attemptsLeft <= 0) return;

    player.attemptsLeft--;
    const cleanGuess = guess.trim().toLowerCase();

    const msg = {
      type: "guess",
      username: player.username,
      guess: guess.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    gameState.messages.push(msg);
    io.emit("new_message", msg);

    if (cleanGuess === gameState.answer) {
      endGame(socket.id);
    } else if (player.attemptsLeft === 0) {
      io.emit("new_message", {
        type: "system",
        text: `${player.username} has no attempts left`,
      });
    }

    if (gameState.players.every((p) => p.attemptsLeft === 0)) endGame(null);

    broadcastPlayers();
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id} (${socket.username})`);
    gameState.players = gameState.players.filter((p) => p.id !== socket.id);

    if (gameState.gameMaster === socket.id && gameState.players.length > 0) {
      gameState.gameMaster = gameState.players[0].id;
    }

    if (gameState.players.length === 0) {
      gameState = {
        players: [],
        gameMaster: null,
        phase: "lobby",
        question: "",
        answer: "",
        questionIsSet: false,
        messages: [],
        timerInterval: null,
      };
    }

    broadcastPlayers();
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
