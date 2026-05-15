<div align="center">
  <h1>👑 Checkers AI</h1>
  <p><strong>From Basic Board to Intelligent Arena: The Next-Generation AI-Powered Checkers Platform.</strong></p>
  <p><code>Python</code> <code>FastAPI</code> <code>React</code> <code>Vite</code> <code>Tailwind CSS</code></p>
</div>

**Checkers AI** is an explainable, responsive, and highly intelligent game platform. It utilizes a powerful backend engine to not just play against you, but to analyze your strategy, provide real-time hints, and give you a comprehensive breakdown of your performance using a sleek, modern interface.

---

## ✨ Features
- **🤖 AI Opponent:** Play against an intelligent AI designed to test your Checkers skills at various difficulty levels.
- **💡 Real-Time AI Insights:** Receive contextual hints from the AI during gameplay to help you improve.
- **📈 Deep Move Analysis:** Review the quality of your moves with integrated analytical tools that evaluate board states and strategic positioning.
- **📝 Post-Game Analysis:** Get a comprehensive breakdown at the end of each match, analyzing your performance, mistakes, and brilliant moves.
- **💾 Persistent Sessions:** Never lose your progress. Sessions are automatically saved so you can resume exactly where you left off.
- **🔐 Secure Authentication:** Complete user management with secure login, JWT authorization, and password hashing.
- **🎨 Premium UI/UX:** A visually stunning, fully responsive interface powered by Tailwind CSS with synchronized layouts, sidebars, and smooth animations.
- **⚡ Real-Time Move Validation:** Immediate feedback on legal moves, automated enforcement of mandatory jumps, and precise tracking of kings.
- **📊 Detailed Statistics:** Keep track of your match history, wins, and overall performance through integrated dashboards.

---

## 🏗️ System Architecture

### 🛠️ Enterprise-Grade Tech Stack

#### **🧠 Backend (Intelligence Layer)**
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi) ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

- 🐍 **Framework:** Python, FastAPI, Uvicorn
- 🍃 **Database:** MongoDB (PyMongo)
- 🔐 **Security/Auth:** JWT (JSON Web Tokens), Passlib (Password Hashing)
- 🔄 **Data Flow:** RESTful API endpoints for game state synchronization and AI move generation.

#### **🖥️ Frontend (Presentation Layer)**
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

- ⚛️ **Architecture:** React 19, Vite (Lightning-fast HMR and build tools).
- 🎨 **Styling:** Tailwind CSS v4 for utility-first, responsive, and animated designs.
- ✒️ **Icons & Typography:** Lucide-React, modern sans-serif fonts.
- 🧭 **State Management:** React Hooks and React Router for seamless single-page application navigation.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js (for frontend dependencies)
- A modern web browser
- MongoDB instance (local or Atlas)

### Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows command
# On Mac/Linux use: source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Environment Configuration:
```bash
cp .env.example .env
```
*(Make sure to update `.env` with your MongoDB connection string!)*

Start the FastAPI server:
```bash
python run.py
```
*The API will be live at `http://localhost:8000`*

### Frontend Setup

Open a **new** terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The UI will be accessible at `http://localhost:5173`*
