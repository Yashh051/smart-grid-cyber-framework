import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000/api";
    }
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8000/api";
};

const API_BASE = getApiBase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("grid_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("grid_token") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      // Validate token with backend /api/auth/me
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session expired");
          return res.json();
        })
        .then((userData) => {
          setUser(userData);
          localStorage.setItem("grid_user", JSON.stringify(userData));
        })
        .catch(() => {
          // Token invalid or server restarted
          logout();
        });
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials. Please check your username and password.");
      }
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("grid_token", data.access_token);
      localStorage.setItem("grid_user", JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      const msg =
        err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
          ? "Backend server is offline. Please make sure the FastAPI server is running on http://127.0.0.1:8000."
          : err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ username, email, full_name, password, role, department }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, full_name, password, role, department }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please try a different username or email.");
      }
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("grid_token", data.access_token);
      localStorage.setItem("grid_user", JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      const msg =
        err.message.includes("Failed to fetch") || err.message.includes("NetworkError")
          ? "Backend server is offline. Please make sure the FastAPI server is running on http://127.0.0.1:8000."
          : err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("grid_token");
    localStorage.removeItem("grid_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
