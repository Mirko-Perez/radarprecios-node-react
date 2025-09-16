import { useContext, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import "./Region.css";
import axios from "axios";
import Select from "react-select";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const regiones = [
  { id: 1, nombre: "Andes", ruta: "andes" },
  { id: 2, nombre: "Capital", ruta: "capital" },
  { id: 3, nombre: "Centro", ruta: "centro" },
  { id: 4, nombre: "Centrooccidente", ruta: "centrooccidente" },
  { id: 5, nombre: "Occidente", ruta: "occidente" },
  { id: 6, nombre: "Oriente", ruta: "oriente" },
];

const Region = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Remove the toast.configure call since it's not needed

  // State declarations
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

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
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
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-8">
        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800">Actualizar Precios</h2>

        {/* Región */}
        <div className="space-y-2">
          <label className="font-semibold text-gray-700">Región:</label>
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
          />
          {isFromCheckIn && selectedRegion && (
            <p className="text-sm text-gray-500">
              Este campo no se puede modificar desde esta vista
            </p>
          )}
        </div>

        {/* Comercio */}
        <div className="space-y-2">
          <label className="font-semibold text-gray-700">Comercio:</label>
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
          />
          {isFromCheckIn && selectedStore && (
            <p className="text-sm text-gray-500">
              Este campo no se puede modificar desde esta vista
            </p>
          )}
        </div>

        {/* Marca */}
        <div className="space-y-2">
          <label className="font-semibold text-gray-700">Marca:</label>
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
          />
        </div>

        {/* Producto */}
        <div className="space-y-2">
          <label className="font-semibold text-gray-700">Producto:</label>
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
                    className={`w-52 rounded-md px-4 py-2 font-bold text-white ${
                      !price ||
                      isSaving ||
                      (selectedBrand?.label === "Fritz" && !quantity)
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isSaving ? "Guardando..." : "Guardar Precio"}
                  </button>
                </div>
              </div>
            </div>
            {saveMessage.text && (
              <div
                className={`font-bold ${
                  saveMessage.isError ? "text-red-600" : "text-green-600"
                }`}
              >
                {saveMessage.text}
              </div>
            )}
          </>
        )}

        {/* Botón de volver atrás */}
        <button
          type="button"
          onClick={() => navigate("/check-in")}
          className="mt-6 w-full rounded-md bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-700"
        >
          Volver Atrás
        </button>
      </div>
    </div>
  );
};

export default Region;
