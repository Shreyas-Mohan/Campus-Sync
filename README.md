# 🎓 CampusSync - Campus Event Management System

CampusSync is a full-stack MERN platform built to streamline event discovery, club management, and administrative approvals at IIITM. It replaces messy WhatsApp groups and scattered emails with a unified, beautiful hub for campus life.

**🌐 Live Demo:** [https://campus-sync-sooty.vercel.app](https://campus-sync-sooty.vercel.app)

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

## 📅 Version History / Changelog

### v1.3.0 - The Integration & Stability Update (Latest)
* **Dynamic Student Feed:** Integrated the "Picked for you" interest-based logic as a native category filter, streamlining the discovery grid UI.
* **RSVP Security & Endpoints:** Handled missing backend event API endpoints and fortified RSVP authorization to fully support independent (non-club) organizers.
* **Streamlined Navbar & Login:** Created a smooth animated hover expansion for the Logout button, added confirmation safeguards against accidental logouts, and bypassed native MS Edge password dual eye-icon interference on login screens.
* **Hero Section Refinement:** Removed static event counts from feed banners for a cleaner UX.

### v1.2.0 - The Architecture & UX Audit Update
* **Access Control:** Fixed Faculty Dashboard routing, unlocking role-specific event approval panels.
* **Server-Side Integrity:** Hardened RSVP limits to prevent network race conditions on sold-out events.
* **Database Optimization:** Implemented cascade deletions for Comments and Notifications to prevent orphan DB records and frontend crashes.
* **Global UX Enhancements:** Added an Axios interceptor for graceful handling of expired JWT tokens, standardized event status via server time (fixing timezone bias), and expanded skeleton loaders.

### v1.1.0 - The Polish Update
* **Cloudinary Integration:** Added high-performance image hosting for Event Posters, Club Logos, and User Avatars.
* **UI/UX Overhaul:** Introduced responsive two-column feed, skeleton loaders during data fetch, and a refined Light Theme.
* **Word Wrapping & Empty States:** Added safe text-wrapping for long comments and visual empty states for search filters.
* **Security Dashboard:** Added robust OTP-based "Change Password" functionality for all user roles.

### v1.0.0 - The Club Hierarchy Update
* **Role Restructure:** Migrated from generic "organizers" to official **Clubs** with `@iiitm.ac.in` verified domains.
* **Club Profiles:** Built dedicated `/club/[slug]` pages featuring follower counts, core team rosters, and social links.
* **Tiered Event Editing:** Allowed clubs to make "safe" edits instantly, while sending critical edits back for Faculty re-approval.
* **Threaded Conversations:** Upgraded Q&A section from 1-on-1 chats to nested, Instagram-style `@tagged` reply threads.
* **Smart UI States:** Handled edge cases for "Event Ended" and "Sold Out" capacity lockouts.

### v0.1.0 - Initial Release
* Basic MERN stack initialization with OTP-based Auth and generic Event CRUD operations.

*(Note: Run `node seedClubs.js` in the server folder to automatically populate official campus clubs).*