import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import LocationPermission from "../components/common/LocationPermission";
import PrivateRoute from "../components/common/PrivateRoute";
import Dashboard from "../pages/admin/dashboard/Dashboard";
import DashboardAvanzado from "../pages/admin/dashboard/DashboardAvanzado";
import ObservationsList from "../pages/admin/dashboard/ObservationsList";
import CrearComercio from "../pages/admin/products/CrearComercio";
import CrearMarca from "../pages/admin/products/CrearMarca";
import CrearProducto from "../pages/admin/products/CrearProducto";
import GestionProductos from "../pages/admin/products/GestionProductos";
import MenuParametros from "../pages/admin/products/MenuParametros";
import CreacionUsuario from "../pages/admin/users/CreacionUsuario";
import ModificarUsuario from "../pages/admin/users/ModificarUsuario";
import UserManagement from "../pages/admin/users/UserManagement";
import Login from "../pages/auth/Login";
import Menu from "../pages/dashboard/Menu";
import MenuAdmin from "../pages/dashboard/MenuAdmin";
import AgendaManager from "../pages/admin/agenda/AgendaManager";
import AdminAgendaPreview from "../pages/admin/agenda/AdminAgendaPreview";
import MyAgenda from "../pages/shared/MyAgenda";
import MenuViewer from "../pages/dashboard/MenuViewer";
import Andes from "../pages/regions/andes/Andes";
import AndesComercio from "../pages/regions/andes/AndesComercio";
import AndesMarca from "../pages/regions/andes/AndesMarca";
import AndesPrecio from "../pages/regions/andes/AndesPrecio";
import AndesProducto from "../pages/regions/andes/AndesProducto";
import AndesVerTodo from "../pages/regions/andes/AndesVerTodo";
import Capital from "../pages/regions/capital/Capital";
import CapitalComercio from "../pages/regions/capital/CapitalComercio";
import CapitalMarca from "../pages/regions/capital/CapitalMarca";
import CapitalPrecio from "../pages/regions/capital/CapitalPrecio";
import CapitalProducto from "../pages/regions/capital/CapitalProducto";
import CapitalVerTodo from "../pages/regions/capital/CapitalVerTodo";
import Centro from "../pages/regions/centro/Centro";
import CentroComercio from "../pages/regions/centro/CentroComercio";
import CentroMarca from "../pages/regions/centro/CentroMarca";
import CentroPrecio from "../pages/regions/centro/CentroPrecio";
import CentroProducto from "../pages/regions/centro/CentroProducto";
import CentroVerTodo from "../pages/regions/centro/CentroVerTodo";
import Centrooccidente from "../pages/regions/centrooccidente/Centrooccidente";
import CentrooccidenteComercio from "../pages/regions/centrooccidente/CentrooccidenteComercio";
import CentrooccidenteMarca from "../pages/regions/centrooccidente/CentrooccidenteMarca";
import CentrooccidentePrecio from "../pages/regions/centrooccidente/CentrooccidentePrecio";
import CentrooccidenteProducto from "../pages/regions/centrooccidente/CentrooccidenteProducto";
import CentrooccidenteVerTodo from "../pages/regions/centrooccidente/CentrooccidenteVerTodo";
import Occidente from "../pages/regions/occidente/Occidente";
import OccidenteComercio from "../pages/regions/occidente/OccidenteComercio";
import OccidenteMarca from "../pages/regions/occidente/OccidenteMarca";
import OccidentePrecio from "../pages/regions/occidente/OccidentePrecio";
import OccidenteProducto from "../pages/regions/occidente/OccidenteProducto";
import OccidenteVerTodo from "../pages/regions/occidente/OccidenteVerTodo";
import Oriente from "../pages/regions/oriente/Oriente";
import OrienteComercio from "../pages/regions/oriente/OrienteComercio";
import OrienteMarca from "../pages/regions/oriente/OrienteMarca";
import OrientePrecio from "../pages/regions/oriente/OrientePrecio";
import OrienteProducto from "../pages/regions/oriente/OrienteProducto";
import OrienteVerTodo from "../pages/regions/oriente/OrienteVerTodo";
import CheckIn from "../pages/shared/CheckIn";
import Region from "../pages/shared/Region";
import FotoAnaquel from "../pages/shared/FotoAnaquel";

function App() {
  return (
    <AuthProvider>
      <LocationPermission>
        <div
          className="app-container"
          style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}
        >
          <Suspense fallback={<div className="loading">Cargando...</div>}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route
                path="/menu"
                element={
                  <PrivateRoute>
                    <Menu />
                  </PrivateRoute>
                }
              />
              <Route
                path="/check-in"
                element={
                  <PrivateRoute>
                    <CheckIn />
                  </PrivateRoute>
                }
              />
              <Route
                path="/regiones"
                element={
                  <PrivateRoute>
                    <MenuViewer />
                  </PrivateRoute>
                }
              />
              <Route
                path="/region"
                element={
                  <PrivateRoute>
                    <Region />
                  </PrivateRoute>
                }
              />
              <Route
                path="/region/:region"
                element={
                  <PrivateRoute>
                    <Region />
                  </PrivateRoute>
                }
              />
              <Route
                path="/andes"
                element={
                  <PrivateRoute>
                    <Andes />
                  </PrivateRoute>
                }
              />
              <Route
                path="/andes/comercio"
                element={
                  <PrivateRoute>
                    <AndesComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/andes/marca"
                element={
                  <PrivateRoute>
                    <AndesMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/andes/producto"
                element={
                  <PrivateRoute>
                    <AndesProducto />
                  </PrivateRoute>
                }
              />
              <Route
                path="/andes/precio"
                element={
                  <PrivateRoute>
                    <AndesPrecio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/andes/ver-todo"
                element={
                  <PrivateRoute>
                    <AndesVerTodo />
                  </PrivateRoute>
                }
              />
              {/* Capital Routes */}
              <Route
                path="/capital"
                element={
                  <PrivateRoute>
                    <Capital />
                  </PrivateRoute>
                }
              />
              <Route
                path="/capital/comercio"
                element={
                  <PrivateRoute>
                    <CapitalComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/capital/marca"
                element={
                  <PrivateRoute>
                    <CapitalMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/capital/producto"
                element={
                  <PrivateRoute>
                    <CapitalProducto />
                  </PrivateRoute>
                }
              />
              <Route
                path="/capital/precio"
                element={
                  <PrivateRoute>
                    <CapitalPrecio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/capital/ver-todo"
                element={
                  <PrivateRoute>
                    <CapitalVerTodo />
                  </PrivateRoute>
                }
              />
              {/* Centro Routes */}
              <Route
                path="/centro"
                element={
                  <PrivateRoute>
                    <Centro />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centro/comercio"
                element={
                  <PrivateRoute>
                    <CentroComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centro/marca"
                element={
                  <PrivateRoute>
                    <CentroMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centro/producto"
                element={
                  <PrivateRoute>
                    <CentroProducto />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centro/precio"
                element={
                  <PrivateRoute>
                    <CentroPrecio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centro/ver-todo"
                element={
                  <PrivateRoute>
                    <CentroVerTodo />
                  </PrivateRoute>
                }
              />
              {/* Centrooccidente Routes */}
              <Route
                path="/centrooccidente"
                element={
                  <PrivateRoute>
                    <Centrooccidente />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centrooccidente/comercio"
                element={
                  <PrivateRoute>
                    <CentrooccidenteComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centrooccidente/marca"
                element={
                  <PrivateRoute>
                    <CentrooccidenteMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centrooccidente/producto"
                element={
                  <PrivateRoute>
                    <CentrooccidenteProducto />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centrooccidente/precio"
                element={
                  <PrivateRoute>
                    <CentrooccidentePrecio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/centrooccidente/ver-todo"
                element={
                  <PrivateRoute>
                    <CentrooccidenteVerTodo />
                  </PrivateRoute>
                }
              />
              {/* Occidente Routes */}
              <Route
                path="/occidente"
                element={
                  <PrivateRoute>
                    <Occidente />
                  </PrivateRoute>
                }
              />
              <Route
                path="/occidente/comercio"
                element={
                  <PrivateRoute>
                    <OccidenteComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/occidente/marca"
                element={
                  <PrivateRoute>
                    <OccidenteMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/occidente/producto"
                element={
                  <PrivateRoute>
                    <OccidenteProducto />
                  </PrivateRoute>
                }
              />
              <Route
                path="/occidente/precio"
                element={
                  <PrivateRoute>
                    <OccidentePrecio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/occidente/ver-todo"
                element={
                  <PrivateRoute>
                    <OccidenteVerTodo />
                  </PrivateRoute>
                }
              />
              {/* Oriente Routes */}
              <Route
                path="/oriente"
                element={
                  <PrivateRoute>
                    <Oriente />
                  </PrivateRoute>
                }
              />
              <Route
                path="/oriente/comercio"
                element={
                  <PrivateRoute>
                    <OrienteComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/oriente/marca"
                element={
                  <PrivateRoute>
                    <OrienteMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/oriente/producto"
                element={
                  <PrivateRoute>
                    <OrienteProducto />
                  </PrivateRoute>
                }
              />
              <Route
                path="/oriente/precio"
                element={
                  <PrivateRoute>
                    <OrientePrecio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/oriente/ver-todo"
                element={
                  <PrivateRoute>
                    <OrienteVerTodo />
                  </PrivateRoute>
                }
              />
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <MenuAdmin />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/agenda-preview"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <AdminAgendaPreview />
                  </PrivateRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <AgendaManager />
                  </PrivateRoute>
                }
              />
              <Route
                path="/mi-agenda"
                element={
                  <PrivateRoute>
                    <MyAgenda />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/crear-usuario"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <Suspense fallback={<div>Cargando...</div>}>
                      <CreacionUsuario />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/modificar-usuario"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <Suspense fallback={<div>Cargando...</div>}>
                      <ModificarUsuario />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/modificar-usuario"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <ModificarUsuario />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/gestion-usuarios"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <UserManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/gestion-productos"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <GestionProductos />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin/dashboard-avanzado"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <DashboardAvanzado />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/observaciones"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <ObservationsList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/parametros"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <MenuParametros />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/parametros/crear-comercio"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <CrearComercio />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/parametros/crear-marca"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <CrearMarca />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/parametros/crear-producto"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <CrearProducto />
                  </PrivateRoute>
                }
              />

              <Route
                path="/foto-anaquel"
                element={
                  <PrivateRoute>
                    <FotoAnaquel />
                  </PrivateRoute>
                }
              />

              {/* Ruta por defecto - Redirige al menú si está autenticado, de lo contrario al login */}
              <Route
                path="*"
                element={
                  <PrivateRoute>
                    <Navigate to="/menu" replace />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
        <ToastContainer position="top-right" newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      </LocationPermission>
    </AuthProvider>
  );
}

export default App;
