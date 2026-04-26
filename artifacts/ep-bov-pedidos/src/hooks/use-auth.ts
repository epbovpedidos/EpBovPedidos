import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("epbov_logged_in") === "true";
    if (!isLoggedIn) {
      setLocation("/");
    }
  }, [setLocation]);

  const login = () => {
    localStorage.setItem("epbov_logged_in", "true");
    setLocation("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("epbov_logged_in");
    setLocation("/");
  };

  return {
    isLoggedIn: localStorage.getItem("epbov_logged_in") === "true",
    login,
    logout,
  };
}
