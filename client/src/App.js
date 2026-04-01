import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentFeed from './pages/StudentFeed';
import OrganizerDashboard from './pages/OrganizerDashboard';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import ClubProfile from './pages/ClubProfile';
import ClubsList from './pages/ClubsList'; // ADDED

const PrivateRoute = ({ children, role, roles }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" />;
  
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/feed" />;
  if (roles && !roles.includes(user.role) && user.role !== 'admin') return <Navigate to="/feed" />;
  
  return children;
};

function ToasterWithTheme() {
  const { isDark } = useTheme();
  return (
    <Toaster position="top-right" toastOptions={{
      style: isDark
        ? { background: '#1c1f27', color: '#f0f0f0', border: '1px solid #2a2d36' }
        : { background: '#ffffff', color: '#0d1526', border: '1px solid #d1daf0', boxShadow: '0 4px 20px rgba(13,21,38,0.1)' },
    }} />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToasterWithTheme />
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<PrivateRoute><StudentFeed /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute roles={['organizer', 'club']}><OrganizerDashboard /></PrivateRoute>} />
            <Route path="/events/:id" element={<PrivateRoute><EventDetails /></PrivateRoute>} />
            <Route path="/club" element={<PrivateRoute><ClubsList /></PrivateRoute>} />
            <Route path="/club/:id" element={<PrivateRoute><ClubProfile /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;