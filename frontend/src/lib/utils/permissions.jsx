/**
 * Check if the current user has the required permissions
 * @param {Object} user - The current user object from AuthContext
 * @param {string|Array} requiredPermissions - Single permission or array of permissions to check
 * @returns {boolean} - True if user has all required permissions
 */
export const hasPermission = (user, requiredPermissions) => {
  if (!user || !user.permisos) return false;
  
  // If user has admin permission, they have access to everything
  if (user.permisos.includes('admin')) return true;
  
  // Handle single permission string or array of permissions
  const permissionsToCheck = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  // Check if user has all required permissions
  return permissionsToCheck.every(permission => 
    user.permisos.includes(permission)
  );
};

/**
 * Check if the current user has any of the specified permissions
 * @param {Object} user - The current user object from AuthContext
 * @param {Array} possiblePermissions - Array of permissions to check against
 * @returns {boolean} - True if user has at least one of the permissions
 */
export const hasAnyPermission = (user, possiblePermissions) => {
  if (!user || !user.permisos) return false;
  if (user.permisos.includes('admin')) return true;
  
  return possiblePermissions.some(permission => 
    user.permisos.includes(permission)
  );
};
