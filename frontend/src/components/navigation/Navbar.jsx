import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import usePermissions from '../../hooks/usePermissions';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { can, isAdmin } = usePermissions();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDropdownToggle = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  if (!user) return null;

  return (
    <nav className="bg-slate-800 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-white text-xl font-bold hover:text-blue-200 transition-colors duration-200"
            >
              Radar de Precios
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
            >
              Inicio
            </Link>
            
            {can('view') && (
              <div className="relative group">
                <button className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center">
                  Regiones
                  <FiChevronDown className="ml-1 w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link to="/andes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Andes</Link>
                    <Link to="/capital" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Capital</Link>
                    <Link to="/centro" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Centro</Link>
                    <Link to="/centrooccidente" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Centrooccidente</Link>
                    <Link to="/occidente" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Occidente</Link>
                    <Link to="/oriente" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">Oriente</Link>
                  </div>
                </div>
              </div>
            )}
            
            {isAdmin && (
              <div className="relative group">
                <button className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center">
                  Administración
                  <FiChevronDown className="ml-1 w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link to="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-200">Usuarios</Link>
                    <Link to="/admin/logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-200">Registros</Link>
                  </div>
                </div>
              </div>
            )}

            {/* User Menu */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center">
                <FiUser className="w-4 h-4 mr-2" />
                {user.username}
                <FiChevronDown className="ml-1 w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200">
                    <FiSettings className="w-4 h-4 mr-2" />
                    Perfil
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  >
                    <FiLogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white hover:bg-slate-700 p-2 rounded-md transition-colors duration-200"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-700 border-t border-slate-600">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              
              {can('view') && (
                <div>
                  <button 
                    onClick={() => handleDropdownToggle('regions')}
                    className="text-gray-300 hover:text-white hover:bg-slate-600 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center justify-between"
                  >
                    Regiones
                    <FiChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${activeDropdown === 'regions' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === 'regions' && (
                    <div className="pl-4 space-y-1">
                      <Link to="/andes" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Andes</Link>
                      <Link to="/capital" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Capital</Link>
                      <Link to="/centro" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Centro</Link>
                      <Link to="/centrooccidente" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Centrooccidente</Link>
                      <Link to="/occidente" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Occidente</Link>
                      <Link to="/oriente" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Oriente</Link>
                    </div>
                  )}
                </div>
              )}
              
              {isAdmin && (
                <div>
                  <button 
                    onClick={() => handleDropdownToggle('admin')}
                    className="text-gray-300 hover:text-white hover:bg-slate-600 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center justify-between"
                  >
                    Administración
                    <FiChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${activeDropdown === 'admin' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === 'admin' && (
                    <div className="pl-4 space-y-1">
                      <Link to="/admin/users" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Usuarios</Link>
                      <Link to="/admin/logs" className="text-gray-400 hover:text-white hover:bg-slate-600 block px-3 py-2 rounded-md text-sm transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>Registros</Link>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-600 pt-2">
                <div className="flex items-center px-3 py-2">
                  <FiUser className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-300 text-base font-medium">{user.username}</span>
                </div>
                <Link 
                  to="/profile" 
                  className="text-gray-300 hover:text-white hover:bg-slate-600 flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Perfil
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-slate-600 flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                >
                  <FiLogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
