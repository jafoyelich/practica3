'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  token: string | null;
  nombre: string | null;
  rol: string | null;
  email: string | null;
}

interface AuthContextType {
  session: UserSession;
  login: (token: string, nombre: string, rol: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>({
    token: null,
    nombre: null,
    rol: null,
    email: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Al montar, cargar datos de sesión almacenados en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const nombre = localStorage.getItem('nombre');
      const rol = localStorage.getItem('rol');
      const email = localStorage.getItem('email');

      if (token) {
        setSession({ token, nombre, rol, email });
      }
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, nombre: string, rol: string, email: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('nombre', nombre);
    localStorage.setItem('rol', rol);
    localStorage.setItem('email', email);
    setSession({ token, nombre, rol, email });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
    localStorage.removeItem('email');
    setSession({ token: null, nombre: null, rol: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return context;
};
