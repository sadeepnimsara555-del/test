import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // Start timer for minimum splash duration (7 seconds)
      const timer = new Promise(resolve => setTimeout(resolve, 7000));
      
      const token = await SecureStore.getItemAsync('userToken');
      const savedUser = await SecureStore.getItemAsync('userData');
      
      // Wait for both the timer and the storage check to complete
      await timer;

      if (token) {
        try {
          const response = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
          setUser(response.data);
        } catch (err) {
          console.log('Error fetching profile on start, using saved data', err);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } else if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.log('Error checking login status', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.log('Login error:', JSON.stringify(error?.response?.data || error?.message));
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        return { success: false, message: 'Cannot connect to server. Make sure the backend is running and EXPO_PUBLIC_API_URL is set to your computer\'s IP address (not localhost).' };
      }
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password, address, phone, role, restaurantName, receiveEmailNotifications) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        address, 
        phone, 
        role, 
        restaurantName,
        receiveEmailNotifications
      });
      const { token, ...userData } = response.data;
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.log('Registration error:', JSON.stringify(error?.response?.data || error?.message));
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        return { success: false, message: 'Cannot connect to server. Make sure the backend is running and EXPO_PUBLIC_API_URL is set to your computer\'s IP address (not localhost).' };
      }
      return { success: false, message: error.response?.data?.message || 'Registration failed. Please try again.' };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData, {
        headers: {
          Authorization: `Bearer ${await SecureStore.getItemAsync('userToken')}`,
        },
      });
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data));
      setUser(response.data);
      return { success: true };
    } catch (error) {
      console.log('Update profile error:', error?.response?.data || error?.message);
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  const updateProfileLocal = async (userData) => {
    try {
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (e) {
      console.log('Error updating local profile', e);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updateProfileLocal }}>
      {children}
    </AuthContext.Provider>
  );
};
