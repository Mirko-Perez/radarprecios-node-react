import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { hasAnyPermission, hasPermission } from "../lib/utils/permissions";

/**
 * Custom hook to check user permissions
 * @returns {Object} Permission checking utilities
 */
const usePermissions = () => {
  const { user } = useContext(AuthContext);

  /**
   * Check if the user has all the specified permissions
   * @param {string|Array} requiredPermissions - Single permission or array of permissions
   * @returns {boolean} - True if user has all required permissions
   */
  const can = (requiredPermissions) => {
    return hasPermission(user, requiredPermissions);
  };

  /**
   * Check if the user has any of the specified permissions
   * @param {Array} possiblePermissions - Array of permissions to check
   * @returns {boolean} - True if user has at least one of the permissions
   */
  const canAny = (possiblePermissions) => {
    return hasAnyPermission(user, possiblePermissions);
  };

  /**
   * Check if the user has the specified permission
   * @param {string} permission - The permission to check
   * @returns {boolean} - True if user has the permission
   */
  const has = (permission) => {
    return hasPermission(user, permission);
  };

  return {
    can,
    canAny,
    has,
    isAdmin: user?.permisos?.includes("admin") || false,
    isEditor: user?.permisos?.includes("edit") || false,
    isViewer: user?.permisos?.includes("view") || false,
  };
};

export default usePermissions;
