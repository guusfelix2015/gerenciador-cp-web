import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import type { User, Workspace } from "@/types";

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  login: (email: string, password: string) => Promise<void>;
  registerCp: (data: { cpName: string; leaderName: string; leaderEmail: string; leaderPassword: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [workspace, setWorkspace] = useState<Workspace | null>(() => {
    const stored = localStorage.getItem("workspace");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.workspace) {
        localStorage.setItem("workspace", JSON.stringify(data.workspace));
        setWorkspace(data.workspace);
      }
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerCp = useCallback(async (data: { cpName: string; leaderName: string; leaderEmail: string; leaderPassword: string }) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.post("/auth/register", data);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      if (res.workspace) {
        localStorage.setItem("workspace", JSON.stringify(res.workspace));
        setWorkspace(res.workspace);
      }
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("workspace");
    setUser(null);
    setWorkspace(null);
    api.post("/auth/logout").catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, workspace, login, registerCp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
