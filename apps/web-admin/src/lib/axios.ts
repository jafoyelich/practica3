import axios from 'axios';

export const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIFFBIiwiZW1haWwiOiJhZG1pbkBzdXBlcm1hcmtldC5ibyIsInJvbGUiOiJhZG1pbmlzdHJhZG9yIiwiZXhwIjoxOTAwMDAwMDAwfQ.SaolpUp0lBkYXPSCsuB_WAKa53EBFoTnbz3uyA-0jJA';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente el token JWT en las cabeceras HTTP
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    config.headers.Authorization = `Bearer ${token || JWT_TOKEN}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
