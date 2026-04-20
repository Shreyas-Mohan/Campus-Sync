import React, { useEffect } from 'react';
import axios from 'axios';
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

function AxiosInterceptor({ children }) {
  const { logout } = useAuth();
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Automatically logout on 401 Unauthorized
        if (error.response?.status === 401) {
          logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);
  return <>{children}</>;
}

const PrivateRoute = ({ children, role, roles }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" />;
  
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/feed" />;
  if (roles && !roles.includes(user.role) && user.role !== 'admin') return <Navigate to="/feed" />;
  
  return children;
};

function ToasterWithTheme() {
  return (
    <Toaster position="top-right" toastOptions={{
      style: { background: '#1c1f27', color: '#f0f0f0', border: '1px solid #2a2d36' },
    }} />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AxiosInterceptor>
          <BrowserRouter>
            <ToasterWithTheme />
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/feed" element={<PrivateRoute><StudentFeed /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute roles={['organizer', 'club', 'faculty']}><OrganizerDashboard /></PrivateRoute>} />
              <Route path="/events/:id" element={<PrivateRoute><EventDetails /></PrivateRoute>} />
              <Route path="/club" element={<PrivateRoute><ClubsList /></PrivateRoute>} />
              <Route path="/club/:id" element={<PrivateRoute><ClubProfile /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            </Routes>
          </BrowserRouter>
        </AxiosInterceptor>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;