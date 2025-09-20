import { useEffect, useState } from 'react';

// Helper: attempt geolocation with limited retries for transient failures
const getLocationWithRetry = (options = {}, retries = 2, delayMs = 1000) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation not supported'));
    }

    const attempt = (remaining) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => {
          // code 2 (POSITION_UNAVAILABLE) is often transient (kCLErrorLocationUnknown)
          if ((err.code === 2 || err.code === err.POSITION_UNAVAILABLE) && remaining > 0) {
            setTimeout(() => attempt(remaining - 1), delayMs);
          } else {
            reject(err);
          }
        },
        options
      );
    };

    attempt(retries);
  });
};

const LocationPermission = ({ children }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (!navigator.geolocation) {
        setError('La geolocalización no es compatible con tu navegador');
        return;
      }

      try {
        // Check current permission status
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        // Handle permission changes
        const handlePermissionChange = () => {
          if (permissionStatus.state === 'granted') {
            setPermissionGranted(true);
            setError(null);
          } else if (permissionStatus.state === 'denied') {
            setPermissionGranted(false);
            setError('Permiso de ubicación denegado. Puedes continuar, pero algunas funciones no usarán geolocalización.');
          }
        };

        // Set initial state
        handlePermissionChange();
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', handlePermissionChange);
        
        // Request permission if not already determined
        if (permissionStatus.state === 'prompt') {
          try {
            await getLocationWithRetry(
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
              2,
              1000
            );
            setPermissionGranted(true);
            setError(null);
          } catch (err) {
            console.error('Error al obtener la ubicación:', err);
            // Do not block UX: show a soft warning and continue
            setError('No se pudo determinar tu ubicación en este momento. Continuaremos sin geolocalización.');
          }
        }

        return () => {
          permissionStatus.removeEventListener('change', handlePermissionChange);
        };
      } catch (err) {
        console.error('Error al verificar permisos de ubicación:', err);
        setError('Error al verificar los permisos de ubicación');
      }
    };

    requestLocationPermission();
  }, []);

  // If there's an error, show a message but still render children
  if (error) {
    return (
      <>
        <div style={{
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          padding: '10px',
          textAlign: 'center',
          fontSize: '14px',
          borderBottom: '1px solid #bfdbfe'
        }}>
          {error}
        </div>
        {children}
      </>
    );
  }

  // If permission is granted or still being determined, just render children
  return children;
};

export default LocationPermission;
