# Math Tug-of-War Game — MVP Architecture Plan (Vibecoding Edition)

## 🎯 FINAL MVP SCOPE

### Gameplay
- 2-player online multiplayer only
- Username entry before joining room (max 10 chars, duplicates allowed)
- Ready-state confirmation before match starts
- 3-minute match duration
- Server-generated math questions (+ − × ÷)
- Immediate scoring (first correct answer wins that round)
- Correct answer → rope animation moves toward player
- First correct answer immediately receives next question
- Sounds for correct answers

### Game Rules
- Server authoritative state
- No persistence (in-memory only)
- Server restart ends game
- Player disconnect → auto-rejoin allowed
- Player ending game → both redirected to home

---

## 🏗️ FINAL ARCHITECTURE

```
                 ┌──────────────────────┐
                 │      FRONTEND        │
                 │  Next.js + Tailwind  │
                 │----------------------│
                 │ UI / Keypad          │
                 │ Animation (SVG/FM)   │
                 │ Sound Effects        │
                 │ Socket Client        │
                 └─────────┬────────────┘
                           │ WebSocket
                           ▼
              ┌──────────────────────────┐
              │   BACKEND (Authoritative)│
              │ Node.js + Socket.io      │
              │--------------------------│
              │ Room Manager             │
              │ Game State Engine        │
              │ Question Generator       │
              │ Answer Validation        │
              │ Animation Event Emitter  │
              │ Reconnection Handler     │
              └──────────────────────────┘
```

---

## 📁 PROJECT STRUCTURE (RECOMMENDED)

```
math-tug-game/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/socket.ts
│   └── styles/
│
└── backend/
    ├── src/
    │   ├── server.js
    │   ├── roomManager.js
    │   ├── gameEngine.js
    │   ├── questionGenerator.js
    │   ├── socketHandlers.js
    │   └── utils/
    └── package.json
```

Separate deployments = simpler scaling + cleaner architecture.

---

## 🚀 DEPLOYMENT PLAN

### Frontend
- Vercel (free tier)
- Automatic CI/CD
- CDN included

### Backend
Recommended free hosts:
- Render (good WebSocket support)
- Railway (also solid)
- Fly.io (more advanced)

Vercel serverless is NOT ideal for persistent WebSockets.

---

## 🔌 SOCKET EVENT DESIGN (MVP)

### Client → Server
- create_room
- join_room
- player_ready
- submit_answer
- leave_game
- reconnect_player

### Server → Client
- room_created
- player_joined
- game_start
- new_question
- answer_result
- rope_animation_event
- timer_update
- game_over
- redirect_home

---

## 🎮 GAME FLOW

1. Player enters username
2. Create or join room via ID
3. Both players click READY
4. Countdown starts
5. Server sends first question
6. Players answer simultaneously
7. Correct answer:
   - Score update
   - Rope animation event
   - Next question immediately
8. Timer ends OR rope threshold reached
9. Game over → redirect both players

---

## 🎨 ANIMATION STRATEGY

Chosen approach:
- SVG animation with event-driven updates

Server emits animation events like:
- move_left
- move_right
- win_animation

Frontend handles interpolation for smooth motion.

---

## 🔊 AUDIO STRATEGY

MVP Sounds:
- Correct answer ding
- Countdown start
- Game win/lose cue

Keep audio client-side only.

---

## 🧠 STATE MODEL (SERVER)

Room State Example:

```
{
  roomId,
  players: [
    { id, username, score, connected }
  ],
  ropePosition,
  currentQuestion,
  timerRemaining,
  status: waiting | playing | finished
}
```

In-memory storage only.

---

## 🛠️ DEBUGGING + LOGGING (IMPORTANT)

Log at minimum:
- Player connect/disconnect
- Room creation/join
- Question generation
- Answer validation
- Game end reason

This saves hours later.

---

## ⚠️ VIBECODING EXECUTION ORDER

1. Basic Next.js UI shell
2. Node WebSocket backend skeleton
3. Room creation/join flow
4. Ready-state sync
5. Question generator (server)
6. Answer validation
7. Rope animation events
8. Timer sync
9. Sounds
10. Deployment

Avoid polishing before step 6.

---

## 🧭 PRINCIPLES FOR THIS BUILD

- Server authoritative always
- Keep MVP extremely tight
- Test multiplayer early
- Avoid persistence for now
- Animation separate from logic

---

## 🔮 POST-MVP IDEAS (NOT NOW)

- Difficulty levels
- Accessibility improvements
- AI question generation
- Leaderboards
- Classroom mode

---

## FINAL NOTE

Ship playable > ship perfect.
Iteration is the strategy.

