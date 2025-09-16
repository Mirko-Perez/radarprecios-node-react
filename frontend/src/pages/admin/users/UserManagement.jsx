import React, { useState } from 'react';
import { FiUserPlus, FiUsers } from 'react-icons/fi';
import CreacionUsuario from './CreacionUsuario';
import ModificarUsuario from './ModificarUsuario';

const UserManagement = () => {
    const [view, setView] = useState(''); // '' | 'crear' | 'modificar'

    // Función para volver al menú principal
    const handleBack = () => setView('');

    return (
        <div className="w-full">
            {view === '' && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <button
                        onClick={() => setView('crear')}
                        className="w-full sm:w-auto max-w-xs bg-white hover:bg-green-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl p-6 group transform hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-center gap-4">
                            <div className="bg-green-100 group-hover:bg-green-200 rounded-full p-3 transition-colors duration-300">
                                <FiUserPlus className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Crear Nuevo Usuario
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Agregar usuario al sistema
                                </p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setView('modificar')}
                        className="w-full sm:w-auto max-w-xs bg-white hover:bg-blue-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl p-6 group transform hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-center gap-4">
                            <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-3 transition-colors duration-300">
                                <FiUsers className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Gestionar Usuarios Existentes
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Modificar usuarios del sistema
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            )}
            <div>
                {view === 'crear' && <CreacionUsuario onCancel={handleBack} />}
                {view === 'modificar' && <ModificarUsuario onBack={handleBack} />}
            </div>
        </div>
    );
};

export default UserManagement;
