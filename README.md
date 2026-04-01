# 🎓 CampusSync - Campus Event Management System

CampusSync is a full-stack MERN platform built to streamline event discovery, club management, and administrative approvals at IIITM. It replaces messy WhatsApp groups and scattered emails with a unified, beautiful hub for campus life.

## ✨ Key Features
* **Role-Based Workflows**: Three distinct dashboards for **Students**, **Clubs**, and **Faculty/Admins**.
* **Official Club Profiles**: Dedicated, shareable club portfolios (`/club/[slug]`) with core team rosters, verified badges, and social links.
* **Tiered Event Approvals**: Clubs can safely edit typos instantly, but critical changes (Venue/Time/Capacity) intelligently require Faculty re-approval.
* **Smart Event Ticketing**: Real-time RSVP tracking with automatic "Sold Out" and "Event Ended" lockouts.
* **Threaded Q&A Discussions**: Interactive, multi-level threaded comment sections for every event.
* **Cloudinary Media**: High-performance, uncropped event poster and logo image hosting.
* **Google Calendar Sync**: 1-click "Add to Calendar" and native mobile sharing.
* **Secure Auth Workflow**: Email verification with Nodemailer OTPs and encrypted passwords via `bcryptjs`.

## 🛠️ Tech Stack
* **Frontend**: React.js, React Router v7, Lucide-Icons, Custom CSS (Dark/Light Themes)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose), Cloudinary (Image Bucket)

## 🚀 Running the Project Locally

### 1. Environment Variables
Create a `.env` file in the `server/` directory and add:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_test_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Install Dependencies
Open two terminals.
**Terminal 1 (Backend):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install
npm start
```

*(Note: Run `node seedClubs.js` in the server folder to automatically populate official campus clubs).*