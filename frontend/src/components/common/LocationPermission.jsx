import { useEffect, useState } from 'react';

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
            setError('Permiso de ubicación denegado. Por favor, habilítalo manualmente en la configuración de tu navegador.');
          }
        };

        // Set initial state
        handlePermissionChange();
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', handlePermissionChange);
        
        // Request permission if not already determined
        if (permissionStatus.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            () => {
              setPermissionGranted(true);
              setError(null);
            },
            (err) => {
              console.error('Error al obtener la ubicación:', err);
              setError('No se pudo acceder a tu ubicación. Algunas funciones pueden no estar disponibles.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
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
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          textAlign: 'center',
          fontSize: '14px',
          borderBottom: '1px solid #ffcdd2'
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
