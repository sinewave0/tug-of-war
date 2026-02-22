# 🎮 Math Tug-of-War

A 2-player online multiplayer math game where players compete to solve math problems and pull the rope to their side!

![Game Preview](https://via.placeholder.com/800x400?text=Math+Tug-of-War+Game)

## 🎯 Gameplay

- **2-player online multiplayer** - Compete against a friend in real-time
- **Math problems** - Addition, subtraction, multiplication, and division
- **Tug-of-war mechanic** - Correct answers pull the rope toward you
- **3-minute matches** - Fast-paced competitive gameplay
- **First to answer wins the round** - Speed matters!

## 🏗️ Architecture

```
┌──────────────────────┐
│      FRONTEND        │
│  Next.js + Tailwind  │
│  Framer Motion       │
│  Socket.io Client    │
└─────────┬────────────┘
          │ WebSocket
          ▼
┌──────────────────────────┐
│   BACKEND                │
│   Node.js + Socket.io    │
│   In-memory Game State   │
└──────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd math-tug-of-war
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

3. **Start the servers**

**Backend:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:3001

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

4. **Play!**
- Open http://localhost:3000 in two browser windows
- Enter usernames
- Create a room in one window
- Join with the room code in the other
- Click "Ready" on both
- Start solving math problems!

## 📁 Project Structure

```
math-tug-of-war/
├── frontend/           # Next.js frontend
│   ├── app/           # App router pages
│   ├── components/    # React components
│   │   ├── LandingPage.tsx
│   │   ├── RoomLobby.tsx
│   │   ├── GameScreen.tsx
│   │   ├── RopeAnimation.tsx
│   │   └── Keypad.tsx
│   ├── hooks/         # Custom hooks
│   │   └── useSocket.ts
│   ├── lib/           # Utilities
│   │   ├── socket.ts
│   │   └── audio.ts
│   └── types/         # TypeScript types
│       └── game.ts
│
├── backend/           # Node.js backend
│   └── src/
│       ├── server.js         # Entry point
│       ├── socketHandlers.js # Socket events
│       ├── roomManager.js    # Room logic
│       └── gameEngine.js     # Game logic
│
└── shared/            # Shared types/constants
    ├── types.ts
    ├── constants.ts
    └── utils.ts
```

## 🎮 Game Flow

1. **Landing Page** - Enter username
2. **Room Lobby** - Create or join a room
3. **Ready Up** - Both players click ready
4. **Countdown** - 3-second countdown
5. **Gameplay** - Solve math problems as fast as you can
6. **Game Over** - Winner declared based on rope position or score

## 🔌 Socket Events

### Client → Server
| Event | Description |
|-------|-------------|
| `create_room` | Create a new game room |
| `join_room` | Join an existing room |
| `player_ready` | Mark player as ready |
| `submit_answer` | Submit an answer |
| `leave_game` | Leave the current game |
| `reconnect_player` | Reconnect after disconnect |

### Server → Client
| Event | Description |
|-------|-------------|
| `room_created` | Room created successfully |
| `player_joined` | New player joined |
| `game_start` | Game is starting |
| `new_question` | New math question |
| `answer_result` | Answer validation result |
| `rope_animation_event` | Rope movement event |
| `timer_update` | Timer countdown update |
| `game_over` | Game ended |
| `redirect_home` | Return to home screen |

## 🎨 Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Socket.io
- **Animations:** Framer Motion + SVG
- **Audio:** Web Audio API

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render/Railway)
```bash
cd backend
# Follow Render/Railway deployment docs
```

**Note:** Vercel serverless functions are NOT ideal for WebSocket connections. Use Render, Railway, or Fly.io for the backend.

## 🧪 Development

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Backend (.env):**
```
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Running Tests
```bash
# Frontend lint
cd frontend
npm run lint

# Backend stress test
cd backend
npm run stress
```

## 📝 Game Rules

1. Server authoritative - all logic runs on backend
2. No persistence - in-memory only
3. Server restart ends all games
4. Player disconnect → 30-second grace period to reconnect
5. First correct answer wins the round and gets the next question
6. Win by reaching ±100 rope position OR highest score after 3 minutes

## 🔮 Future Enhancements

- Difficulty levels
- AI question generation
- Leaderboards
- Spectator mode
- Classroom mode (teacher dashboard)

## 📄 License

MIT

---

Built with ❤️ using the vibecoding approach!
