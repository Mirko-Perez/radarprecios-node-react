import React from "react";
import { Navigate } from "react-router-dom";
import NoAccess from "../components/common/NoAccess";
import { useAuth } from "../contexts/AuthContext";

/**
 * Higher-Order Component to protect routes based on permissions
 * @param {React.Component} Component - The component to protect
 * @param {Object} options - Configuration options
 * @param {string|Array} options.requiredPermission - Required permission(s)
 * @param {boolean} options.redirectToLogin - Whether to redirect to login or show no access
 * @returns {React.Component} - Protected component
 */
/**
 * Higher-Order Component to protect routes based on permissions
 * @param {React.Component} WrappedComponent - The component to protect
 * @param {Object} options - Configuration options
 * @param {string|Array} options.requiredPermission - Required permission(s)
 * @param {boolean} options.redirectToLogin - Whether to redirect to login or show no access
 * @param {boolean} options.showFallback - Whether to show fallback UI when permission is denied
 * @param {React.Component} options.fallbackComponent - Custom fallback component to render when permission is denied
 * @returns {React.Component} - Protected component
 */
const withPermission = (WrappedComponent, options = {}) => {
  const {
    requiredPermission,
    redirectToLogin = true,
    showFallback = true,
    fallbackComponent: FallbackComponent = NoAccess,
  } = options;

  const WithPermission = (props) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show loading state while auth is being checked
    if (loading) {
      return null; // Or a loading spinner
    }

    // If no user is logged in
    if (!user) {
      return redirectToLogin ? (
        <Navigate to="/login" state={{ from: location.pathname }} replace />
      ) : (
        <NoAccess />
      );
    }

    // Check if user has the required permission
    const hasAccess =
      !requiredPermission ||
      hasPermission(user, requiredPermission) ||
      hasPermission(user, "admin");

    // If user has permission, render the component
    if (hasAccess) {
      return <WrappedComponent {...props} />;
    }

    // User is logged in but doesn't have permission
    if (showFallback) {
      return FallbackComponent ? <FallbackComponent /> : <NoAccess />;
    }

    // Return null if no fallback should be shown
    return null;
  };

  // Set a display name for better debugging
  const componentName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithPermission.displayName = `withPermission(${componentName})`;

  return WithPermission;
};

export default withPermission;
