import React, { useState } from 'react';
import { FiUserPlus, FiUsers } from 'react-icons/fi';
import CreacionUsuario from './CreacionUsuario';
import ModificarUsuario from './ModificarUsuario';
import { downloadExcel } from '../../../lib/utils/downloadExcel';

const UserManagement = () => {
    const [view, setView] = useState(''); // '' | 'crear' | 'modificar'
    const [userFilter, setUserFilter] = useState('');

    // Función para volver al menú principal
    const handleBack = () => setView('');

    return (
        <div className="w-full max-w-full p-0 m-0 bg-transparent">
            {view === '' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            👤 Usuarios
                        </h3>
                        <div className="space-y-3">
                            <button
                                type="button"
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow hover:from-green-600 hover:to-green-700 transition transform hover:-translate-y-0.5"
                                onClick={() => setView('crear')}
                            >
                                ➕ Crear Usuario
                            </button>
                            <button
                                type="button"
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow hover:from-gray-600 hover:to-gray-700 transition transform hover:-translate-y-0.5"
                                onClick={() => setView('modificar')}
                            >
                                📋 Gestionar Usuarios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Render crear usuario como modal/section aparte si se requiere */}
            {view === 'crear' && (
                <CreacionUsuario onCancel={handleBack} />
            )}

            {/* Sección de tabla al estilo MenuParametros */}
            {view === 'modificar' && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    downloadExcel('/api/export/excel', { type: 'usuarios', q: userFilter || undefined, stream: 1 }, 'usuarios.xlsx');
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow hover:from-green-700 hover:to-green-800 transition"
                                title="Exportar a Excel"
                            >
                                ⬇️ Exportar Excel
                            </button>
                            <button
                                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow hover:from-gray-600 hover:to-gray-700 transition"
                                onClick={handleBack}
                            >
                                ✖️ Cerrar
                            </button>
                        </div>
                    </div>

                    {/* Tabla embebida */}
                    <ModificarUsuario embedded filter={userFilter} onFilterChange={setUserFilter} />
                </div>
            )}
        </div>
    );
};

export default UserManagement;
