## 🎮 Game Overview

**Guess2Win** is a real-time multiplayer game where:
- One player acts as the **Game Master** 👑
- Other players compete to guess the correct answer first
- All guesses appear instantly in a shared chat-style interface
- Each player has only **3 attempts**
- The game ends when someone guesses correctly or time runs out (60 seconds)

## ✨ Features

- Real-time multiplayer using Socket.io
- Clean, modern dark UI with Tailwind CSS
- Server-side authentication (username validation)
- Live player list with Game Master badge
- Master-only controls (create question + start game)
- 60-second countdown timer (enforced by server)
- Score tracking (10 points per correct guess)
- Automatic Game Master rotation after each round
- No new players can join mid-game
- Fully responsive design
- Beginner-friendly and readable code

## 🎯 How to Play

### 1. Joining the Game
- Open the game link in your browser
- Enter a unique username (minimum 2 characters)
- Click **"JOIN GAME"**
- The first player automatically becomes the **Game Master**

### 2. Lobby Phase
- Wait for other players to join
- The Game Master can:
  - Create a question and its secret answer
  - Start the game (requires at least 2 players + 1 saved question)

### 3. Gameplay
- The question is revealed to everyone
- Players type their guesses in the input box
- All guesses are visible to everyone in real-time
- Each player has **maximum 3 attempts**
- First player to guess the correct answer **wins 10 points**
- Game ends if:
  - Someone guesses correctly, or
  - 60 seconds timer expires

### 4. After Each Round
- Winner is announced
- Correct answer is revealed
- Updated scoreboard is shown
- Game Master is automatically rotated to the next player
- New round can be started by the new Game Master

## 🛠️ Tech Stack

### Frontend (Client)
- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (ES6+)
- Socket.io Client

### Backend (Server)
- Node.js
- Express.js
- Socket.io
- CORS


🎮 Game Rules Summary

Minimum 2 players required to start
Only the Game Master can create questions and start the game
Each player gets exactly 3 attempts
First correct guess wins the round (+10 points)
No points awarded if time runs out
New players cannot join once the game has started
Game Master rotates automatically after each round

```bash
🛠️ Project Structure
dami-guessing-game/
├── index.html          # Single-page frontend
├── server.js           # Backend with Socket.io + auth
├── package.json
└── README.md
```


📝 Future Enhancements (Ideas)

Sound effects for correct/incorrect guesses
Timer visual progress bar
Categories (Riddles, Movies, Science, etc.)
Private rooms with game codes
Leaderboard persistence
Dark/Light mode toggle


👨‍💻 Author
Damilola Ajele