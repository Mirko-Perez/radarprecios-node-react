import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import "../shared/AdminForms.css";

const CreacionUsuario = ({ onCancel }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permissionId, setPermissionId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([
    { id: 3, name: "Editor" },
    { id: 4, name: "Viewer" },
  ]);

  const { user } = useAuth();

  // Verificar si el usuario actual es superadmin (permissionId = 1)
  useEffect(() => {
    if (user?.permissionId === 1) {
      setAvailableRoles([
        { id: 2, name: "Admin" },
        { id: 3, name: "Editor" },
        { id: 4, name: "Viewer" },
      ]);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden");
    }

    if (password.length < 8) {
      return setError("La contraseña debe tener al menos 8 caracteres");
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/admin/usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            username,
            password,
            permission_id: parseInt(permissionId, 10),
            email: email || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear el usuario");
      }

      setSuccess("Usuario creado exitosamente");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setPermissionId("");
      setEmail("");
    } catch (err) {
      setError(err.message || "Error al crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <h2>Crear Nuevo Usuario</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="username">Nombre de usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email (opcional):</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="permissionId">Rol del Usuario:</label>
          <select
            id="permissionId"
            value={permissionId}
            onChange={(e) => setPermissionId(e.target.value)}
            required
            className="form-control"
          >
            <option value="">Seleccione un rol</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creando..." : "Crear Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreacionUsuario;
