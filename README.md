# 🚗 RIDE BUDDY – Student Ride Sharing App

RIDE BUDDY is a real-time ride-sharing web app tailored for college students. Whether you're heading to campus or returning home, easily post a cab ride or join one. Simple, secure, and social – just how student transport should be!

---

## 🌐 Live URLs

- **Frontend**: [ride-buddy-indol.vercel.app](https://ride-buddy-indol.vercel.app)
- **Backend API**: [ride-buddy-f1xh.onrender.com](https://ride-buddy-f1xh.onrender.com)

---

## 🚀 Features

### 🧳 Ride Posting
- Add your route (e.g., Sector 62 ➡️ Sector 128)
- Set cab departure time
- Mention available seats
- Enter total fare
- Upload screenshot of cab fare for transparency

### 🔍 Find a Ride
- Filter rides by:
  - Departure time
  - Cost (lowest first)
  - Available seats
- View screenshots before joining
- Request to join + chat with ride owner

### 💬 Real-Time Chat
- Once a ride is requested, students can chat directly with the ride owner
- Chat only opens when ride is requested
- Socket.IO powered for live messages

### 🧾 Cost Transparency
- Uploaded cab fare screenshot builds trust
- Fare breakup = No confusion

### 🔐 Authentication
- Sign up/login using college email (e.g., `@yourcollege.edu`)
- JWT-based auth

### 🧑‍🤝‍🧑 Passenger Management
- Drivers see list of passengers who accepted the ride
- Rides with more than one available seat can be joined by multiple students

---

## 🗺️ Pages Overview

- **Landing Page** – Login or Sign Up
- **Home Page** – Choose to post or find a ride
- **Post Ride Page** – Submit a new ride
- **Find Ride Page** – Browse and filter rides
- **Ride Detail + Chat Page** – Chat + Confirm booking
- **Current Ride Page (for driver)** – See passengers + details
- **History Page** – View past rides
- **Profile Page** – All rides posted or joined

---

## ⚙️ Tech Stack

| Part         | Tech                              |
|--------------|-----------------------------------|
| Frontend     | React + Tailwind CSS              |
| Backend      | Node.js + Express.js              |
| Database     | MongoDB (Mongoose)                |
| Auth         | JWT + College Email Verification  |
| Realtime Chat| Socket.IO                         |
| Image Upload | Cloudinary                        |
| Hosting      | Vercel (Frontend), Render (Backend) |

---

## 🧠 Future Improvements

- 🚫 Cancel/edit rides
- ⭐ Ratings after rides
- 💡 Filter rides by time, price, and seat count
- 📍 Google Maps

---

## 🏁 How to Run Locally

### Backend
```bash
cd server
npm install
node server.js
```

### Make a .env file with:
```bash
# .env.example

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

### Frontend 
```bash
cd client
npm instant
npm run dev
```

---

## 🚗 RIDE BUDDY — built with ❤️ and JavaScript by Rashi Dwivedi
  
Passionate full-stack developer building solutions one line of code at a time.  
[LinkedIn](https://linkedin.com/in/rashi-dwivedi-796032339) | [GitHub](https://github.com/Rashi-Dwivedi1812)


