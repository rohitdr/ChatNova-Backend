# ⚙️ ChatNova Backend

Backend server for **ChatNova – Real-Time Chat Application** built with Node.js, Express, MongoDB, and Socket.IO.


## 🚀 Overview

This backend powers real-time messaging, authentication, user presence, and notification systems for ChatNova.

It handles:

* REST APIs
* WebSocket communication
* Authentication & authorization
* Database operations


## ⚙️ Tech Stack

- 🟢 Node.js
- 🚀 Express.js
- 🍃 MongoDB (Mongoose)
- 🔌 Socket.IO
- 🔐 JWT (Access + Refresh Token)
- 🔒 bcrypt (Password hashing)
- ☁️ Cloudinary (Media storage & uploads)
- ✅ Express Validator (Request validation)
- 📡 Firebase Admin SDK (Push Notifications)


## ✨ Features

* ⚡ Real-time messaging using Socket.IO
* 🟢 Online/offline user tracking (multi-tab support)
* 💬 Message status (sent, delivered, seen)
* 🔔 Unread message count system
* 👍 Message reactions & reply system
* 👥 Group chat with admin role support
* 🛠️ Group creation & management
* 🔐 Secure authentication (JWT + refresh tokens)
* 🔄 Token refresh & protected routes
* 🔔 Push notifications (Firebase FCM)

---

## 🧠 Key Concepts

* Event-driven architecture using WebSockets
* Scalable user presence tracking using Map
* Debounced disconnect handling for stability
* JWT access + refresh token flow
* Optimistic UI sync with backend events
* Aggregation pipelines for chat/user queries

---

## 📁 Folder Structure

```id="b1xk2p"
src/
├── controllers/       # Route logic
├── routes/            # API routes
├── models/            # Mongoose schemas
├── middleware/        # Auth & validation middleware
├── socket/            # Socket.IO logic & handlers
├── utils/             # Helper functions
├── config/            # DB & external configs
├── Server.js           # Entry point
```

---

## 🔧 Environment Variables

Create a `.env` file:

```env id="c0z9kd"
## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

ACCESS_SECRET=your_jwt_access_secret
REFRESS_SECRET=your_jwt_refresh_secret

FRONTEND_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 📌 Notes

* Keep `.env` file private (never commit to GitHub)
* Use strong secrets for JWT tokens
* Replace `\n` properly in Firebase private key if needed
* Ensure frontend URL matches your client app

```

---

## ▶️ Getting Started

## ▶️ Getting Started

### 1. Clone repo

```bash
git clone https://github.com/your-username/chatnova-backend.git
cd chatnova-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run server (development)

```bash
nodemon Server.cjs
```

---

### ✅ Optional (recommended)

Add this script in `package.json`:

```json
"scripts": {
  "dev": "nodemon Server.cjs",
  "start": "node Server.cjs"
}
```

Then you can run:

```bash
npm run dev
```


## 🔌 Socket Events

### Client → Server

* `join_group` → join a conversation
* `sendMessage` → Send message
* `typing` → Typing indicator

### Server → Client

* `getOnlineUsers` → Active users list
* `newMessage` → Receive message
* `message_delivered` → Delivery update
* `message_seen` → Seen update

---

## 📡 API Endpoints (Sample)

### Auth
- POST `/api/auth/register` → Register user  
- POST `/api/auth/login` → Login & get tokens  

### User
- GET `/api/users/search` → Search users  

### Conversation
- GET `/api/groups/createGroup` → Create Group  

### Message
- POST `/api/messages/sendMessage` → Send message  



## 📌 Notes

* Uses Map to track active users across multiple tabs
* Disconnect handled with debounce to avoid false offline status
* Socket + REST combined for real-time + persistence

## 🌐 Live Links

- Backend API: https://chatnova-backend-1.onrender.com

## 🔗 Frontend Repository

👉 https://github.com/rohitdr/ChatNova-Frontend.git


## 👨‍💻 Author

Rohit Kumar



## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
