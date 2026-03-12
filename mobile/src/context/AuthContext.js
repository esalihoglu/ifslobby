import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const data = await authAPI.getMe();
        setUser(data.user);
        await connectSocket();
      }
    } catch {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    await connectSocket();
    return data;
  }

  async function register(email, password, displayName, department, title) {
    const data = await authAPI.register({ email, password, displayName, department, title });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    await connectSocket();
    return data;
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch {
      // Devam et
    }
    disconnectSocket();
    await AsyncStorage.removeItem('token');
    setUser(null);
  }

  async function updateProfile(updates) {
    const data = await authAPI.updateProfile(updates);
    setUser(data.user);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
