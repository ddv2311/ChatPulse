# 💬 ChatPulse - Real-Time Chat Application

ChatPulse is a full-stack real-time chat application featuring a **React 19 + Tailwind CSS** frontend and a **Node.js + Express + MongoDB** backend. It offers real-time messaging with secure authentication and a modern, responsive user interface.

---

## 🚀 Features

* 🔐 **User Authentication** (JWT-based login/register)
* 💬 **Real-Time Messaging** using Socket.io
* 🎨 **Clean UI** with Tailwind CSS & DaisyUI
* 📡 **WebSocket Server** for instant communication
* 🧠 **Global State Management** via Zustand
* 🗺️ **Client-side Routing** using React Router
* 🔒 **Password Hashing** using Bcrypt
* 🌍 **MongoDB Integration** with Mongoose

---

## 🧰 Tech Stack

### 🔧 Frontend

* [React 19](https://react.dev)
* [Tailwind CSS](https://tailwindcss.com/)
* [DaisyUI](https://daisyui.com/)
* [Socket.io Client](https://socket.io/)
* [Zustand](https://zustand-demo.pmnd.rs/)
* [React Router](https://reactrouter.com/)

### ⚙️ Backend

* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
* [Socket.io Server](https://socket.io/)
* [JWT](https://jwt.io/) Authentication
* [Bcrypt](https://www.npmjs.com/package/bcrypt) for secure password hashing

---

## 📁 Project Structure

```
ChatPulse/
├── backend/              # Node.js backend
│   ├── config/           # MongoDB connection & JWT utils
│   ├── controllers/      # API route controllers
│   ├── models/           # Mongoose data models
│   ├── routes/           # Express routes
│   └── server.js         # Entry point for backend server
│
├── frontend/             # React frontend with Vite
│   ├── src/
│   │   ├── assets/       # Images, logos, etc.
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Auth and chat views
│   │   ├── store/        # Zustand state management
│   │   ├── App.jsx       # Root component
│   │   └── main.jsx      # Entry point for Vite
│
├── .env                  # Environment variables
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### ✅ Prerequisites

* Node.js v14 or higher
* MongoDB (local or cloud e.g. Atlas)

---

### 🔧 Installation

```bash
git clone https://github.com/ddv2311/ChatPulse.git
cd ChatPulse
npm install
```

---

### 🧪 Running in Development

This command starts **both frontend and backend** concurrently.

```bash
npm run dev
```

---

### 🚀 Build for Production

1. Build the frontend using Vite:

   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend server:

   ```bash
   cd ../backend
   npm start
   ```

---

## 🔐 Environment Configuration

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://<your-cluster>
JWT_SECRET=your_jwt_secret
```

---

## 📌 Live Deployment

You can try the live version of ChatPulse here:

🔗 [https://chatpulse-ddv.onrender.com/login](https://chatpulse-ddv.onrender.com/login)

---

## 📌 Roadmap & Upcoming Features

* ✅ Chat Rooms & Private Messaging
* ⏳ Notifications (in-app or push)
* ⏳ Mobile Optimization / PWA Support

---



## 📝 License

This project is licensed under the **ISC License**.
Feel free to fork, contribute, and adapt!

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you’d like to change.

---

## 💡 Author

**ChatPulse** is maintained by [@ddv2311](https://github.com/ddv2311)

---
