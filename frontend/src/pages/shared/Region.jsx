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
        .get(`${API_URL}/brands?store_id=${selectedStore.value}`)
        .then((response) => {
          setBrands(Array.isArray(response.data) ? response.data : []);
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
          setProducts(Array.isArray(response.data) ? response.data : []);
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
    <div className="region-container">
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
      <h2>Actualizar Precios</h2>
      <div className="region-selector" style={{ marginBottom: "20px" }}>
        <label>Región:</label>
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
          <div style={{ marginTop: "5px", color: "#666", fontSize: "0.9em" }}>
            Este campo no se puede modificar desde esta vista
          </div>
        )}
      </div>

      <div className="store-selector" style={{ marginBottom: "20px" }}>
        <label>Comercio:</label>
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
          <div style={{ marginTop: "5px", color: "#666", fontSize: "0.9em" }}>
            Este campo no se puede modificar desde esta vista
          </div>
        )}
      </div>

      <div className="brand-selector" style={{ marginBottom: "20px" }}>
        <label>Marca:</label>
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

      <div className="product-selector" style={{ marginBottom: "20px" }}>
        <label htmlFor="product">Producto:</label>
        <Select
          id="product"
          options={products.map((product) => ({
            value: product.product_id,
            label: product.product_name,
            image: product.imagen
              ? `${API_URL}${product.imagen}`
              : "/default-product.png",
          }))}
          value={selectedProduct}
          onChange={handleProductChange}
          placeholder={
            productsLoading ? "Cargando productos..." : "Selecciona un producto"
          }
          isDisabled={!selectedBrand || productsLoading}
          isClearable
          formatOptionLabel={(product) => (
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={product.image}
                alt={product.label}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-product.png";
                }}
                style={{
                  width: "30px",
                  height: "30px",
                  marginRight: "10px",
                  objectFit: "contain",
                }}
              />
              <span>{product.label}</span>
            </div>
          )}
          styles={{
            option: (provided, state) => ({
              ...provided,
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
            }),
            singleValue: (provided, state) => ({
              ...provided,
              display: "flex",
              alignItems: "center",
              height: "100%",
            }),
          }}
        />
      </div>

      {selectedProduct && (
        <>
          <div className="price-input-container" style={{ margin: "20px 0" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {/* Cantidad (solo para Fritz) */}
              {selectedBrand && selectedBrand.label === "Fritz" && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <label style={{ fontWeight: "bold", minWidth: "80px" }}>
                    Cantidad:
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Cantidad"
                    min="1"
                    step="1"
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      width: "150px",
                    }}
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
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    width: "150px",
                  }}
                />
              </div>

              {/* Botón de Tomar Foto */}
              <div style={{ marginTop: "5px" }}>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="photo-upload"
                  style={{
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  {photo ? "Cambiar Foto" : "Tomar Foto"}
                </label>
              </div>

              {/* Vista previa de la foto */}
              {photoPreview && (
                <div style={{ marginTop: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        overflow: "hidden",
                        marginBottom: "10px",
                      }}
                    >
                      <img
                        src={photoPreview}
                        alt="Vista previa"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview("");
                      }}
                      style={{
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        alignSelf: "flex-start",
                      }}
                    >
                      Eliminar Foto
                    </button>
                  </div>
                </div>
              )}

              {/* Botón de Guardar Precio */}
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={handleSavePrice}
                  disabled={
                    !price ||
                    isSaving ||
                    (selectedBrand?.label === "Fritz" && !quantity)
                  }
                  style={{
                    backgroundColor:
                      !price ||
                      isSaving ||
                      (selectedBrand?.label === "Fritz" && !quantity)
                        ? "#ccc"
                        : "#4CAF50",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    cursor:
                      !price ||
                      isSaving ||
                      (selectedBrand?.label === "Fritz" && !quantity)
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "bold",
                    width: "200px",
                    fontSize: "16px",
                  }}
                >
                  {isSaving ? "Guardando..." : "Guardar Precio"}
                </button>
              </div>
            </div>
          </div>
          {saveMessage.text && (
            <div
              style={{
                marginTop: "10px",
                color: saveMessage.isError ? "#f44336" : "#4CAF50",
                fontWeight: "bold",
              }}
            >
              {saveMessage.text}
            </div>
          )}
        </>
      )}

      <div
        className="observation-container"
        style={{
          margin: "30px 0",
          padding: "20px",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginBottom: "15px" }}>Agregar Observación</h3>
        <textarea
          value={observation}
          onChange={(e) => {
            setObservation(e.target.value);
            setObservationMessage({ text: "", isError: false });
          }}
          placeholder="Escribe tu observación aquí..."
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginBottom: "10px",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
          }}
        />
        <button
          onClick={async () => {
            if (!observation.trim()) {
              setObservationMessage({
                text: "Por favor ingresa una observación",
                isError: true,
              });
              return;
            }

            try {
              if (!user || !user.id) {
                throw new Error(
                  "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
                );
              }

              setIsSavingObservation(true);
              const userId = user.id;

              const token = localStorage.getItem("token");
              const response = await axios.post(
                `${API_URL}/observations`,
                {
                  observation_string: observation,
                  user_id: userId,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
              );

              if (response.data && response.data.success) {
                setObservationMessage({
                  text:
                    response.data.message ||
                    "Observación guardada correctamente",
                  isError: false,
                });
                setObservation(""); // Limpiar el campo después de guardar
              } else {
                throw new Error(
                  response.data?.message || "Error al guardar la observación",
                );
              }
            } catch (error) {
              console.error("Error al guardar la observación:", error);
              console.log("Server error details:", error.response?.data);
              let errorMessage = "Error al guardar la observación";
              if (error.response) {
                // Server responded with an error status code
                errorMessage =
                  error.response.data?.message ||
                  error.response.data?.error ||
                  "Error del servidor";
              } else if (error.request) {
                // Request was made but no response was received
                errorMessage =
                  "No se recibió respuesta del servidor. Verifica tu conexión a internet.";
              } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = "Error al configurar la solicitud";
              }
              setObservationMessage({
                text: errorMessage,
                isError: true,
              });
            } finally {
              setIsSavingObservation(false);
            }
          }}
          disabled={!observation.trim() || isSavingObservation}
          style={{
            backgroundColor:
              !observation.trim() || isSavingObservation
                ? "#cccccc"
                : "#4CAF50",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor:
              !observation.trim() || isSavingObservation
                ? "not-allowed"
                : "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {isSavingObservation ? "Guardando..." : "Guardar Observación"}
        </button>
        {observationMessage.text && (
          <div
            style={{
              marginTop: "10px",
              color: observationMessage.isError ? "#f44336" : "#4CAF50",
              fontWeight: "bold",
            }}
          >
            {observationMessage.text}
          </div>
        )}
      </div>

      <button
        className="back-btn"
        onClick={() => navigate("/check-in")}
        style={{ marginTop: "20px" }}
      >
        Volver atrás
      </button>
    </div>
  );
};

export default Region;
