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
* 🔄 **Message Forwarding** to users and groups
* 📊 **Read Status Tracking** with visual indicators
* 🔔 **Real-time Delivery Notifications**
* 📞 **Voice & Video Calling** via WebRTC and SimplePeer
* 🔒 **End-to-End Encryption** for secure messaging
* 🔔 **Push Notifications** for new messages and calls

---

## 🧰 Tech Stack

### 🔧 Frontend

* [React 19](https://react.dev)
* [Tailwind CSS](https://tailwindcss.com/)
* [DaisyUI](https://daisyui.com/)
* [Socket.io Client](https://socket.io/)
* [Zustand](https://zustand-demo.pmnd.rs/)
* [React Router](https://reactrouter.com/)
* [SimplePeer](https://github.com/feross/simple-peer) for WebRTC

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
│   │   │   ├── GroupMessage.jsx    # Group chat message component
│   │   │   ├── DirectMessage.jsx   # Direct message component
│   │   │   ├── ForwardMessageModal.jsx # Message forwarding interface
│   │   │   └── ...
│   │   ├── pages/        # Auth and chat views
│   │   ├── store/        # Zustand state management
│   │   │   ├── useAuthStore.js     # Authentication state management
│   │   │   ├── useChatStore.js     # Direct messaging state management
│   │   │   ├── useGroupStore.js    # Group chat state management
│   │   │   └── ...
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

## 📑 Key Features Explained

### 🔄 Message Forwarding

ChatPulse allows users to forward messages between direct chats and group conversations:

- **Forwarding Interface**: Access the forward option from the message action menu
- **Tabbed Selection**: Choose between forwarding to individual users or groups
- **Original Source Tracking**: Forwarded messages show the original sender with a visual indicator
- **Media Support**: Forward all types of content including text, images, videos, and documents

### 📊 Read Status Tracking

Messages include detailed read status information:

- **Visual Indicators**: See how many users have read your messages
- **Detailed List**: Click on the indicator to see exactly who has read your message
- **Timestamp Integration**: Read status appears alongside message timestamps for clean UI
- **Forwarded Message Awareness**: Special handling for read status in forwarded messages

### 📞 Voice & Video Calling

ChatPulse features real-time communication capabilities:

- **WebRTC Integration**: Peer-to-peer connection for low-latency calls
- **SimplePeer Library**: Easy-to-use WebRTC implementation
- **One-Click Calling**: Initiate calls directly from chat interfaces
- **Audio/Video Toggle**: Control media streams during calls
- **Call Status Updates**: Real-time updates for call events (ringing, accepted, ended)

### 🔔 Notifications

Stay updated with important events:

- **Push Notifications**: Get alerted about new messages even when app is in background
- **Call Alerts**: Receive notifications for incoming calls
- **Custom Sounds**: Different notification sounds for messages vs. calls
- **Notification Preferences**: Control which notifications you receive

### 🔒 End-to-End Encryption

Secure communication for peace of mind:

- **Message Encryption**: All messages are encrypted end-to-end
- **Key Exchange**: Secure key exchange protocol between users
- **Private Conversations**: No one, not even server admins, can read your messages
- **Visual Security Indicators**: See when conversations are secured

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
* ✅ Message Forwarding
* ✅ Read Status Tracking
* ✅ Voice & Video Calling
* ✅ Push Notifications
* ✅ End-to-End Encryption
* ⏳ Mobile Optimization / PWA Support
* ⏳ Screen Sharing

---

## 📝 License

This project is licensed under the **ISC License**.
Feel free to fork, contribute, and adapt!

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 💡 Author

**ChatPulse** is maintained by [@ddv2311](https://github.com/ddv2311)

---
