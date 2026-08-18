import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("token");
    return saved && saved !== "undefined" && saved !== "null" ? saved : null;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    if (accessToken && accessToken !== "undefined") {
      setToken(accessToken);
      localStorage.setItem("token", accessToken);
    }
    if (refreshToken && refreshToken !== "undefined") {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken && refreshToken !== "undefined") {
      API.post("/auth/logout", { refreshToken }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const updateUser = (partialUpdate) => {
    setUser((prev) => {
      const updated = { ...prev, ...partialUpdate };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);