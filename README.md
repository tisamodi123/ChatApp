# ChatApp

A full-stack real-time messaging application built with React, Node.js, Express, and Socket.io. Supports community channels, 1-on-1 direct messages, live online status, typing indicators, and customizable themes.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, DaisyUI, Zustand, Lucide React
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose (with an in-memory fallback for quick local testing)
- **Authentication**: JWT (cookies + Bearer token) & bcryptjs

---

## Features

- **Real-Time Chat**: Bidirectional communication powered by Socket.io.
- **Channels & Direct Messages**: Switch between public rooms (`#general`, `#dev-talk`, `#random`) and 1-on-1 private chats.
- **Online Presence**: Live status badges showing who is currently online.
- **Typing Indicators**: Displays when another user is typing in a room or direct conversation.
- **Notification Sounds**: Built-in audio chime synthesized with the Web Audio API (no external audio files needed) with mute toggle.
- **Auth & Sessions**: User registration and login with bcrypt-hashed passwords and JWT authentication.
- **Dual Storage**: Saves messages to MongoDB if connected, or smoothly falls back to an in-memory store if running without a database.
- **Theme Support**: Dark and light mode toggle.

---

## Project Structure

```
real-time-chat-app/
├── backend/
│   ├── config/          # Database connection (db.js)
│   ├── controllers/     # Route controllers (auth, messages, users)
│   ├── middleware/      # JWT auth middleware and error handling
│   ├── models/          # Mongoose schemas (User, Message, Room)
│   ├── routes/          # Express API route definitions
│   ├── socket/          # Socket.io connection and event handlers
│   ├── store/           # In-memory store fallback
│   ├── public/          # Static fallback HTML client
│   ├── .env             # Backend environment variables
│   ├── .env.example     # Environment template
│   ├── index.js         # Backend server entry point
│   └── package.json     # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Chat UI, sidebar, navbar, modals
│   │   ├── context/     # Socket.io context provider
│   │   ├── store/       # Zustand state management (auth & chat)
│   │   ├── utils/       # Web Audio synthesizer utility
│   │   ├── App.jsx      # Root component
│   │   └── main.jsx     # Entry point
│   ├── tailwind.config.js
│   ├── vite.config.js   # Vite dev server with API & WebSocket proxy
│   └── package.json     # Frontend dependencies
│
├── .env.example         # Root env template
├── .gitignore
├── package.json         # Root scripts to run both apps
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB (optional — in-memory fallback will work automatically if MongoDB is not running)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/real-time-chat-app.git
cd real-time-chat-app
```

### 2. Install dependencies

Install dependencies for both backend and frontend:

```bash
npm run install:all
```

*(Or manually `npm install` inside both `./backend` and `./frontend` folders).*

### 3. Environment Variables

Create a `.env` file inside the `backend` folder (or copy from `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_jwt_secret_key
```

### 4. Build and Run

To build the frontend and run the production server:

```bash
npm run build
npm start
```

Open your browser at `http://localhost:5000`.

---

## Development Mode

If you're developing and want hot reloading:

```bash
# Start backend server (port 5000)
npm run dev:backend

# In a separate terminal, start frontend with Vite (port 3000)
npm run dev:frontend
```

The Vite dev server proxies API calls and WebSocket connections directly to the backend.

---

## Testing Real-Time Chat Locally

To test real-time communication on a single machine:

1. Open `http://localhost:5000` (or `http://localhost:3000` in dev mode) in **Browser Window 1**.
2. Click **Tisa Modi** (or sign up with a new account).
3. Open `http://localhost:5000` in an **Incognito Window** or a **second browser**.
4. Click **Riddhi Patel** (or create another user account).
5. Send messages between both tabs to see instant delivery, typing indicators, online status updates, and audio chimes.


