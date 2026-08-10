import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// LOGIC: Token storage key for Superdong Admin Dashboard
export const TOKEN_STORAGE_KEY = 'superdong_access_token';

// LOGIC: Retrieve base API URL strictly from Vite environment variable VITE_API
const envApi = (import.meta as any).env?.VITE_API;

const getBaseURL = () => {
  if (envApi) {
    return envApi.endsWith('/') ? envApi : `${envApi}/`;
  }
  return '/v1/';
};

export const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// LOGIC: Request interceptor attaching Authorization Bearer token and Locale header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('superdong_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const locale = localStorage.getItem('locale') || 'vi';
    if (config.headers) {
      config.headers.Locale = locale;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// LOGIC: Response interceptor handling responses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      console.warn('API 401 Unauthorized từ Server Backend.');
    }
    return Promise.reject(error);
  }
);

export default api;
