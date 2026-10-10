// Src/api/axiosInstance.ts
//
// Single shared axios instance for the whole app. Modeled on the
// Dhanapal-DigiGold-New reference project's src/api/axiosInstance.ts,
// adapted to this project's existing Src/Config/BaseUrl.js instead of
// introducing a new .env / react-native-dotenv setup.
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../Config/BaseUrl';
import { getAuthToken } from '../Utills/AsynchStorageHelper';
import { navigate } from '../Navigations/navigationRef';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach the stored auth token.
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Response interceptor — on 401, clear stored auth and redirect to Login.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'userData', 'hasMpin', 'isLoggedIn']);
      navigate('Login');
    }
    return Promise.reject(error);
  }
);
