import { useContext, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import "./Region.css";
import axios from "axios";
import Select from "react-select";
import { FiLogOut } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const regiones = [
  { id: 1, nombre: "Andes", ruta: "andes" },
  { id: 2, nombre: "Capital", ruta: "capital" },
  { id: 3, nombre: "Centro", ruta: "centro" },
  { id: 4, nombre: "Centrooccidente", ruta: "centrooccidente" },
  { id: 5, nombre: "Occidente", ruta: "occidente" },
  { id: 6, nombre: "Oriente", ruta: "oriente" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    borderRadius: "0.5rem",
    padding: "0.25rem",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#374151",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),
};

const Region = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useContext(AuthContext);

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isFromCheckIn, setIsFromCheckIn] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: "", isError: false });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [observation, setObservation] = useState("");
  const [description, setDescription] = useState("");

  const [quantity, setQuantity] = useState("");
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [observationMessage, setObservationMessage] = useState({
    text: "",
    isError: false,
  });
  const [loading, setLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [isCheckingActiveCheckIn, setIsCheckingActiveCheckIn] = useState(true);

  // Check for active check-in on component mount
  useEffect(() => {
    const checkActiveCheckIn = async () => {
      try {
        const response = await axios.get(`${API_URL}/checkins/active`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
        });

        // Handle the backend response format correctly
        if (response.data && response.data.success && response.data.data) {
          const checkInData = response.data.data;
          // Map the backend field names to frontend expected names
          setActiveCheckIn({
            ...checkInData,
            checkin_id: checkInData.checkin_id,
            region_nombre: checkInData.region_name,
            comercio_nombre: checkInData.store_name,
            region_id: checkInData.region_id,
            store_id: checkInData.store_id,
            created_at: checkInData.created_at
          });
        } else {
          // No active check-in found
          setActiveCheckIn(null);
        }
      } catch (error) {
        console.error("Error al verificar check-in activo:", error);
        setActiveCheckIn(null);
      } finally {
        setIsCheckingActiveCheckIn(false);
      }
    };

    if (token) {
      checkActiveCheckIn();
    } else {
      setIsCheckingActiveCheckIn(false);
    }
  }, [token]);

  // Check for passed state from CheckIn
  useEffect(() => {
    const loadRegionAndStore = async () => {
      if (!location.state) return;

      const {
        selectedRegion: regionId,
        selectedStore: storeId,
        regionName,
        storeName,
      } = location.state;

      if (!regionId || !regionName) return;

      setIsFromCheckIn(true);
      const region = regiones.find((r) => r.id === regionId);
      if (!region) return;

      setSelectedRegion(region);
      setLoading(true);

      try {
        // Load stores for the region
        const response = await axios.get(
          `${API_URL}/stores/region/${regionId}`,
          {
            headers: { "Cache-Control": "no-cache" }, // Prevent caching
          },
        );

        const storesData = Array.isArray(response.data) ? response.data : [];
        setStores(storesData);

        // After stores are loaded, try to select the store if provided
        if (storeId && storeName) {
          const store = storesData.find((s) => s.store_id === storeId);
          if (store) {
            const storeOption = {
              value: store.store_id,
              label: store.store_name,
              ...store,
            };
            // Use a small timeout to ensure state updates are processed in order
            setTimeout(() => {
              setSelectedStore(storeOption);
            }, 0);
          }
        }
      } catch (error) {
        console.error("Error loading stores:", error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    loadRegionAndStore();
  }, [location.state]);

  useEffect(() => {
    // Only run this effect if not coming from CheckIn
    if (!isFromCheckIn) {
      if (selectedRegion) {
        setLoading(true);
        axios
          .get(`${API_URL}/stores/region/${selectedRegion.id}`)
          .then((response) => {
            setStores(Array.isArray(response.data) ? response.data : []);
            setSelectedStore(null);
          })
          .catch(() => {
            setStores([]);
            setSelectedStore(null);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setStores([]);
        setSelectedStore(null);
      }
    }
    setBrands([]);
    setSelectedBrand(null);
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedStore) {
      setBrandsLoading(true);
      axios
        .get(`${API_URL}/brands/store/${selectedStore.value}`)
        .then((response) => {
          // Handle new consistent response format
          const brandsData = response.data.success ? response.data.data : response.data;
          setBrands(Array.isArray(brandsData) ? brandsData : []);
        })
        .catch(() => {
          setBrands([]);
        })
        .finally(() => {
          setBrandsLoading(false);
        });
    } else {
      setBrands([]);
      setSelectedBrand(null);
    }
  }, [selectedStore]);

  const handleStoreChange = (selectedOption) => {
    setSelectedStore(selectedOption);
    setSelectedBrand(null);
  };

  const handleBrandChange = (selectedOption) => {
    setSelectedBrand(selectedOption);
    setSelectedProduct(null);

    if (selectedOption) {
      // Fetch products for the selected brand
      setProductsLoading(true);
      axios
        .get(`${API_URL}/products/brand/${selectedOption.value}`)
        .then((response) => {
          // Handle new consistent response format
          const productsData = response.data.success ? response.data.data : response.data;
          setProducts(Array.isArray(productsData) ? productsData : []);
        })
        .catch(() => {
          setProducts([]);
        })
        .finally(() => {
          setProductsLoading(false);
        });
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
  };

  const handleProductChange = (selectedOption) => {
    setSelectedProduct(selectedOption);
    setSaveMessage({ text: "", isError: false });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePrice = async () => {
    // Validate required fields
    if (!selectedProduct || !price || !selectedStore) {
      const missingFields = [];
      if (!selectedProduct) missingFields.push("producto");
      if (!price) missingFields.push("precio");
      if (!selectedStore) missingFields.push("comercio");

      setSaveMessage({
        text: `Por favor selecciona ${missingFields.join(", ")}`,
        isError: true,
      });
      return;
    }

    // Clear any previous save message
    setSaveMessage({ text: "", isError: false });

    setIsSaving(true);
    setSaveMessage({ text: "", isError: false });

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Log the data being sent for debugging
      console.log("Sending price data:", {
        product_id: selectedProduct.value,
        store_id: selectedStore.value,
        price: price,
        quantity:
          selectedBrand && selectedBrand.label === "Fritz" ? quantity : null,
        photo: photo ? photo.name : "no photo",
      });

      // Ensure we're sending proper numeric values
      formData.append("product_id", selectedProduct.value.toString());
      formData.append("store_id", selectedStore.value.toString());
      formData.append("price_amount", parseFloat(price).toString());

      // Add quantity only if brand is Fritz
      if (selectedBrand && selectedBrand.label === "Fritz" && quantity) {
        formData.append("quantity", parseInt(quantity, 10).toString());
      }

      // Append photo if available
      if (photo) {
        formData.append("photo", photo);
      }

      if (description.trim()) {
        formData.append("description", description);
      }

      const response = await axios.post(`${API_URL}/prices`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });

      console.log("Server response:", response.data);

      if (response.data && response.data.success) {
        toast.success(response.data.message || "Precio guardado correctamente");
        setSaveMessage({
          text: response.data.message || "Precio guardado correctamente",
          isError: false,
        });
        // Clear the form
        setPrice("");
        setPhoto(null);
        setPhotoPreview("");
        setDescription("");
        setSelectedProduct(null);
        
        // If user came from check-in, they can now navigate back
        if (isFromCheckIn && activeCheckIn) {
          setTimeout(() => {
            navigate("/check-in");
          }, 2000);
        }
      } else {
        throw new Error(response.data?.message || "Error al guardar el precio");
      }
    } catch (error) {
      console.error("Error saving price:", error);
      console.log("Server error details:", error.response?.data);

      let errorMessage = "Error al guardar el precio";

      if (error.response) {
        // Server responded with an error status code
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Error del servidor";

        // If error is related to price format
        if (error.response.data?.error === "Invalid price format") {
          errorMessage = "Por favor ingrese un precio válido (ejemplo: 123.45)";
        }
      } else if (error.request) {
        // Request was made but no response was received
        errorMessage =
          "No se recibió respuesta del servidor. Verifica tu conexión a internet.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = "Error al configurar la solicitud";
      }

      toast.error(errorMessage);
      setSaveMessage({
        text: errorMessage,
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);
    }
  };

  const handleBackNavigation = () => {
    if (activeCheckIn) {
      // If user has active check-in, go back to check-in page
      navigate("/check-in");
    } else {
      // Otherwise, go to home or previous page
      navigate("/");
    }
  };

  if (isCheckingActiveCheckIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Actualizar Precios</h2>
              
              {/* Botón de Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Active Check-In Status */}
            {activeCheckIn && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Check-In Activo
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Región</p>
                    <p className="text-gray-900">
                      {activeCheckIn.region_nombre || selectedRegion?.nombre || "Desconocida"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Tienda</p>
                    <p className="text-gray-900">
                      {activeCheckIn.comercio_nombre || selectedStore?.label || "Desconocida"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Región */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Región:</label>
              <Select
                options={regiones.map((r) => ({ value: r.id, label: r.nombre }))}
                value={
                  selectedRegion
                    ? { value: selectedRegion.id, label: selectedRegion.nombre }
                    : null
                }
                onChange={(option) =>
                  setSelectedRegion(
                    option ? regiones.find((r) => r.id === option.value) : null,
                  )
                }
                placeholder="Selecciona una región..."
                isDisabled={loading || isFromCheckIn}
                isClearable={!isFromCheckIn}
                styles={customSelectStyles}
              />
              {isFromCheckIn && selectedRegion && (
                <p className="text-sm text-gray-500">
                  Este campo no se puede modificar desde esta vista
                </p>
              )}
            </div>

            {/* Comercio */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Comercio:</label>
              <Select
                options={stores.map((s) => ({
                  value: s.store_id,
                  label: s.store_name,
                }))}
                value={selectedStore}
                onChange={handleStoreChange}
                placeholder={
                  loading ? "Cargando comercios..." : "Selecciona un comercio"
                }
                isDisabled={!selectedRegion || loading || isFromCheckIn}
                isClearable={!isFromCheckIn}
                styles={customSelectStyles}
              />
              {isFromCheckIn && selectedStore && (
                <p className="text-sm text-gray-500">
                  Este campo no se puede modificar desde esta vista
                </p>
              )}
            </div>

            {/* Marca */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Marca:</label>
              <Select
                options={brands.map((brand) => ({
                  value: brand.brand_id,
                  label: brand.brand_name,
                }))}
                value={selectedBrand}
                onChange={handleBrandChange}
                placeholder={
                  brandsLoading ? "Cargando marcas..." : "Selecciona una marca"
                }
                isDisabled={!selectedStore || brandsLoading}
                isClearable
                styles={customSelectStyles}
              />
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Producto:</label>
              <Select
                id="product"
                options={products.map((product) => ({
                  value: product.product_id,
                  label: product.product_name,
                }))}
                value={selectedProduct}
                onChange={handleProductChange}
                placeholder={
                  productsLoading
                    ? "Cargando productos..."
                    : "Selecciona un producto"
                }
                isDisabled={!selectedBrand || productsLoading}
                isClearable
                styles={customSelectStyles}
              />
            </div>

            {selectedProduct && (
              <>
                <div className="price-input-container" style={{ margin: "20px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "15px",
                    }}
                  >
                    {/* Cantidad (solo para Fritz) */}
                    {selectedBrand?.label === "Fritz" && (
                      <div className="flex items-center gap-3">
                        <label className="w-24 font-semibold">Cantidad:</label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Cantidad"
                          min="1"
                          step="1"
                          className="w-40 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                      </div>
                    )}

                    {/* Precio */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "10px" }}
                    >
                      <label style={{ fontWeight: "bold", minWidth: "80px" }}>
                        Precio:
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ingrese el precio"
                        step="0.01"
                        min="0"
                        className="w-40 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                      />
                    </div>

                    {/* Botón de Tomar Foto */}
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-block cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        {photo ? "Cambiar Foto" : "Tomar Foto"}
                      </label>
                    </div>

                    {/* Vista previa de la foto */}
                    {photoPreview && (
                      <div className="flex flex-col items-start space-y-2">
                        <img
                          src={photoPreview}
                          alt="Vista previa"
                          className="h-24 w-24 rounded-md border border-gray-300 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview("");
                          }}
                          className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                        >
                          Eliminar Foto
                        </button>
                      </div>
                    )}

                    {/* Descripción del producto */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Descripción del Producto
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Este campo es <strong>opcional</strong>. Puedes agregar una
                        descripción clara y precisa para identificar mejor el
                        producto.
                      </p>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ejemplo: Pack de 6 unidades de 500ml con tapa rosca"
                        className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                      />
                    </div>

                    {/* Botón de Guardar Precio */}
                    <div>
                      <button
                        type="button"
                        onClick={handleSavePrice}
                        disabled={
                          !price ||
                          isSaving ||
                          (selectedBrand?.label === "Fritz" && !quantity)
                        }
                        className={`w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg ${
                          !price ||
                          isSaving ||
                          (selectedBrand?.label === "Fritz" && !quantity)
                            ? "cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="flex items-center justify-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6V4h6v2H9z"
                            />
                          </svg>
                          {isSaving ? "Guardando..." : "Guardar Precio"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                {saveMessage.text && (
                  <div
                    className={`p-4 rounded-xl border-l-4 ${
                      saveMessage.isError
                        ? "bg-red-50 border-red-400 text-red-700"
                        : "bg-green-50 border-green-400 text-green-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${
                          saveMessage.isError ? "bg-red-400" : "bg-green-400"
                        }`}
                      ></div>
                      <p className="font-medium">{saveMessage.text}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Botón de volver atrás */}
            <button
              type="button"
              onClick={handleBackNavigation}
              className="mt-6 w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {activeCheckIn ? "Volver al Check-In" : "Volver al Menú"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Region;
