import { createContext, useContext, useState } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user && !!token;

  const login = async (userData, authToken) => {
    try {
      setLoading(true);

      // Validar datos
      if (!authToken || !userData?.id) {
        throw new Error("Datos de autenticación inválidos");
      }

      // Guardar en el estado
      setUser(userData);
      setToken(authToken);

      // Guardar en localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", authToken);

      return true;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Limpiar estado
    setUser(null);
    setToken(null);

    // Limpiar localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Opcional: Llamada al servidor para invalidar el token
    // ...
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};

export default AuthContext;
