import React, { createContext, useContext, useState } from 'react';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('cs_user')));
  const [token, setToken] = useState(() => localStorage.getItem('cs_token'));
  const login = (userData, tokenData) => {
    setUser(userData); setToken(tokenData);
    localStorage.setItem('cs_user', JSON.stringify(userData));
    localStorage.setItem('cs_token', tokenData);
  };
  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('cs_user');
    localStorage.removeItem('cs_token');
  };
  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);