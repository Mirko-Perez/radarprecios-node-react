import axios from "axios";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { FaMapMarkerAlt } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [brands, setBrands] = useState([]);
  const [regions, setRegions] = useState([]);

  // Filter states
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(""); // Default to all regions
  const [searchTerm, setSearchTerm] = useState("");
  const [regionAverages, setRegionAverages] = useState([]);
  const [productGroupAverages, setProductGroupAverages] = useState([]);
  const [brandStats, setBrandStats] = useState([]);
  const [topAndBottomBrands, setTopAndBottomBrands] = useState([]);
  const chartRef = useRef(null);

  // Process brands to get top 2, bottom 2, and Fritz in the middle
  const processBrandsForChart = (brands) => {
    if (!Array.isArray(brands) || brands.length === 0) {
      setTopAndBottomBrands([]);
      return;
    }

    // Hacer una copia para no modificar el array original
    const sortedBrands = [...brands].sort(
      (a, b) => b.average_price - a.average_price,
    );

    // Encontrar la marca Fritz si existe
    const fritzBrand = sortedBrands.find(
      (brand) => brand.brand && brand.brand.toLowerCase().includes("fritz"),
    );

    // Obtener las 2 marcas más caras (excluyendo Fritz si está en el top 2)
    const topBrands = sortedBrands
      .filter((brand) => !fritzBrand || brand.brand !== fritzBrand.brand)
      .slice(0, 2);

    // Obtener las 2 marcas más baratas (excluyendo Fritz si está en el bottom 2)
    const bottomBrands = sortedBrands
      .filter((brand) => !fritzBrand || brand.brand !== fritzBrand.brand)
      .slice(-2);

    // Crear el array final con el orden: top 2, Fritz (si existe), bottom 2
    let result = [...topBrands];

    // Si Fritz existe, agregarla al medio
    if (fritzBrand) {
      result.push(fritzBrand);
    }

    // Agregar las 2 marcas más barotas al final
    result = [...result, ...bottomBrands];

    // Si no hay suficientes marcas, llenar con valores nulos para mantener la estructura
    while (result.length < 5) {
      result.push({
        brand: `Marca ${result.length + 1}`,
        average_price: 0,
        product_count: 0,
        price_segment: "N/A",
        vs_average_percentage: 0,
      });
    }

    // Limitar a 5 marcas (2 top, Fritz, 2 bottom)
    setTopAndBottomBrands(result.slice(0, 5));
  };

  // Fetch brand statistics with proper error handling and request cancellation
  // Fetch brand statistics for all regions if 'all' is selected, else normal
  const fetchBrandStats = async (regionId = "", groupId = "") => {
    if (!regionId) {
      setBrandStats([]);
      setTopAndBottomBrands([]);
      return;
    }

    try {
      setBrandStats([]);
      setTopAndBottomBrands([]);
      const allBrandsWithStats = [];

      if (regionId === "all") {
        // For all regions, get all brands first
        const brandsResponse = await axios.get(`${API_URL}/brands`, {
          timeout: 10000,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        const brandsData = brandsResponse.data.success
          ? brandsResponse.data.data
          : brandsResponse.data;
        const brands = Array.isArray(brandsData) ? brandsData : [];

        // Get price stats for each brand
        for (const brand of brands) {
          try {
            const statsResponse = await axios.get(
              `${API_URL}/brands/${brand.brand_id}/price-stats`,
              {
                timeout: 10000,
                headers: {
                  "Cache-Control": "no-cache",
                },
              },
            );

            const statsData = statsResponse.data.success
              ? statsResponse.data.data
              : statsResponse.data;
            allBrandsWithStats.push({
              ...brand,
              ...statsData,
              brand: brand.brand_name,
              average_price: parseFloat(statsData.average_price) || 0,
              product_count: parseInt(statsData.total_products) || 0,
              price_count: parseInt(statsData.total_prices) || 0,
            });
          } catch (error) {
            console.error(
              `Error fetching stats for brand ${brand.brand_id}:`,
              error,
            );
            // Include brand without stats
            allBrandsWithStats.push({
              ...brand,
              brand: brand.brand_name,
              average_price: 0,
              product_count: 0,
              price_count: 0,
            });
          }
        }
      } else {
        // For specific region, get brands by stores in that region
        const storesResponse = await axios.get(
          `${API_URL}/stores/region/${regionId}`,
          {
            timeout: 10000,
            headers: {
              "Cache-Control": "no-cache",
            },
          },
        );

        const storesData = storesResponse.data.success
          ? storesResponse.data.data
          : storesResponse.data;
        let regionBrands = [];

        // Get brands for each store in the region
        for (const store of storesData) {
          try {
            const brandsResponse = await axios.get(
              `${API_URL}/brands/store/${store.store_id}`,
              {
                timeout: 10000,
                headers: {
                  "Cache-Control": "no-cache",
                },
              },
            );
            const brandsData = brandsResponse.data.success
              ? brandsResponse.data.data
              : brandsResponse.data;
            regionBrands = regionBrands.concat(
              Array.isArray(brandsData) ? brandsData : [],
            );
          } catch (error) {
            console.error(
              `Error fetching brands for store ${store.store_id}:`,
              error,
            );
          }
        }

        // Remove duplicates based on brand_id
        const uniqueBrands = regionBrands.filter(
          (brand, index, self) =>
            index === self.findIndex((b) => b.brand_id === brand.brand_id),
        );

        // Get price stats for each unique brand
        for (const brand of uniqueBrands) {
          try {
            const statsResponse = await axios.get(
              `${API_URL}/brands/${brand.brand_id}/price-stats`,
              {
                timeout: 10000,
                headers: {
                  "Cache-Control": "no-cache",
                },
              },
            );

            const statsData = statsResponse.data.success
              ? statsResponse.data.data
              : statsResponse.data;
            allBrandsWithStats.push({
              ...brand,
              ...statsData,
              brand: brand.brand_name,
              average_price: parseFloat(statsData.average_price) || 0,
              product_count: parseInt(statsData.total_products) || 0,
              price_count: parseInt(statsData.total_prices) || 0,
            });
          } catch (error) {
            console.error(
              `Error fetching stats for brand ${brand.brand_id}:`,
              error,
            );
            // Include brand without stats
            allBrandsWithStats.push({
              ...brand,
              brand: brand.brand_name,
              average_price: 0,
              product_count: 0,
              price_count: 0,
            });
          }
        }
      }

      setBrandStats(allBrandsWithStats);
      processBrandsForChart(allBrandsWithStats);
    } catch (error) {
      console.error("Error fetching brand stats:", error);
      setBrandStats([]);
      setTopAndBottomBrands([]);
    }
  };

  // Fetch average prices by product and group
  const fetchProductGroupAverages = async (regionId = "all") => {
    try {
      const params = new URLSearchParams();
      if (regionId && regionId !== "all") {
        params.append("region_id", regionId);
      }

      const response = await axios.get(
        `${API_URL}/prices/averages-by-product-group?${params.toString()}`,
      );

      // Agrupar por producto y grupo
      const groupedData = {};

      response.data.forEach((item) => {
        const productName = item.product_name || "Sin nombre";
        const groupName = item.group_name || "Sin grupo";
        const price = parseFloat(item.average_price) || 0;
        const storeCount = parseInt(item.store_count) || 0;

        // Crear una clave única para el producto y grupo
        const key = `${productName.toLowerCase().trim()}_${groupName.toLowerCase().trim()}`;

        if (!groupedData[key]) {
          // Si no existe, crear una nueva entrada
          groupedData[key] = {
            product_name: productName,
            group_name: groupName,
            total_price: 0,
            total_stores: 0,
            count: 0,
          };
        }

        // Sumar precios y tiendas
        if (price > 0) {
          groupedData[key].total_price += price;
          groupedData[key].total_stores += storeCount;
          groupedData[key].count++;
        }
      });

      // Calcular promedios y formatear los datos
      const processedData = Object.values(groupedData).map((item) => {
        const average_price =
          item.count > 0 ? item.total_price / item.count : 0;

        return {
          ...item,
          region_id: regionId,
          region:
            regions.find((r) => r.region_id == regionId)?.region_name ||
            "Todas las regiones",
          average_price: parseFloat(average_price.toFixed(2)),
          store_count: item.total_stores,
          producto: item.product_name, // Mantener para compatibilidad
          grupo: item.group_name, // Mantener para compatibilidad
          precio_promedio: parseFloat(average_price.toFixed(2)), // Mantener para compatibilidad
        };
      });

      setProductGroupAverages(processedData);
    } catch (error) {
      console.error("Error fetching product group averages:", error);
      setProductGroupAverages([]);
    }
  };

  // Fetch region averages with product and group details
  const fetchRegionAverages = async (regionId = "all") => {
    if (!regionId) {
      setRegionAverages([]);
      return;
    }
    
    try {
      let allData = [];
      
      if (regionId === "all" && Array.isArray(regions) && regions.length > 0) {
        // For all regions, get overview data from each region
        for (const region of regions) {
          try {
            const response = await axios.get(`${API_URL}/overview/${region.region_id}`);
            const data = response.data.success ? response.data.data : response.data;
            
            if (Array.isArray(data)) {
              // Add region info to each item
              const dataWithRegion = data.map(item => ({
                ...item,
                region_id: region.region_id,
                region_name: region.region_name
              }));
              allData = allData.concat(dataWithRegion);
            }
          } catch (error) {
            console.error(`Error fetching data for region ${region.region_id}:`, error);
          }
        }
      } else {
        // For specific region, use overview endpoint
        const response = await axios.get(`${API_URL}/overview/${regionId}`);
        const data = response.data.success ? response.data.data : response.data;
        
        if (Array.isArray(data)) {
          const selectedRegionData = regions.find(r => r.region_id == regionId);
          allData = data.map(item => ({
            ...item,
            region_id: regionId,
            region_name: selectedRegionData?.region_name || "Sin región"
          }));
        }
      }

      // Process the data to create region averages
      const processedData = allData.map(item => {
        return {
          region: item.region_name || "Sin región",
          region_id: item.region_id,
          grupo: item.group_name || "Sin grupo",
          producto: item.product_name || "Sin nombre",
          precio_promedio: parseFloat(item.price_amount) || 0,
          brand_name: item.brand_name || "Sin marca",
          store_name: item.store_name || "Sin tienda"
        };
      });
      
      setRegionAverages(processedData);
    } catch (error) {
      console.error("Error fetching region averages:", error);
      setRegionAverages([]);
    }
  };

  // Fetch initial data when component mounts
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchInitialData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);

        // 1. Check user permissions
        if (user && user.permissionId > 2) {
          navigate("/unauthorized");
          return;
        }

        // 2. Fetch regions
        const regionsResponse = await axios.get(`${API_URL}/regions`, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!isMounted) return;

        // Handle new consistent response format
        const regionsData = regionsResponse.data.success
          ? regionsResponse.data.data
          : regionsResponse.data;
        const formattedRegions = regionsData.map((region) => ({
          region_id: String(region.region_id || region.id || ""),
          region_name: String(
            region.region_name || region.name || "Sin nombre",
          ),
        }));

        setRegions(formattedRegions);

        // Set default region to 'all' if not set
        if (!selectedRegion) {
          setSelectedRegion("all");
        }

        // 3. Fetch initial region averages
        await fetchRegionAverages(selectedRegion || "all");
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled:", error.message);
        } else if (!isMounted) {
          console.log("Component unmounted, skipping state update");
        } else {
          console.error("Error in fetchInitialData:", error);
          setError("Error al cargar los datos iniciales");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
      controller.abort("Component unmounted, canceling requests");
    };
  }, [user, navigate]);

  // Handle region changes and fetch related data
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (!isMounted || !selectedRegion) return;

      try {
        setLoading(true);

        // 1. Fetch groups for the selected region
        await fetchGroups(selectedRegion);

        // 2. Fetch region averages (for the first table)
        await fetchRegionAverages(selectedRegion);

        // 3. Fetch product group averages (for the second table)
        await fetchProductGroupAverages(selectedRegion);

        // 4. Fetch brand stats for the selected region
        await fetchBrandStats(selectedRegion, selectedGroup);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled:", error.message);
        } else if (isMounted) {
          console.error("Error in region change handler:", error);
          setError("Error al cargar los datos de la región");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch if we have a valid region selection
    if (selectedRegion) {
      fetchData();
    }

    return () => {
      isMounted = false;
      controller.abort(
        "Component unmounted or region changed, canceling requests",
      );
    };
  }, [selectedRegion, selectedGroup]);

  // Fetch groups with prices for the selected region
  const fetchGroups = async (regionId) => {
    // If no region is selected, don't show any groups
    if (!regionId || regionId === "all") {
      setGroups([]);
      setSelectedGroup("all");
      return [];
    }

    try {
      // Fetch products with prices for the selected region
      const response = await axios.get(
        `${API_URL}/prices/average-by-region?region_id=${regionId}`,
        {
          timeout: 10000,
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      if (!Array.isArray(response?.data)) {
        console.error("Unexpected response format from API:", response?.data);
        setError("Formato de respuesta inesperado del servidor");
        setGroups([]);
        return [];
      }

      // Get unique groups that have at least one product with price > 0
      const groupsWithPrices = response.data
        .filter((item) => {
          const hasValidGroup = item.grupo && typeof item.grupo === "string";
          const hasValidPrice =
            item.precio_promedio !== null &&
            item.precio_promedio !== undefined &&
            !isNaN(parseFloat(item.precio_promedio)) &&
            parseFloat(item.precio_promedio) > 0;

          return hasValidGroup && hasValidPrice;
        })
        .map((item) => item.grupo.trim());

      const uniqueGroups = [...new Set(groupsWithPrices)];

      // Format groups for dropdown
      const formattedGroups = uniqueGroups
        .filter(Boolean) // Remove any empty/null group names
        .map((groupName) => ({
          group_id: groupName.toLowerCase().replace(/\s+/g, "-"),
          group_name: groupName,
        }));

      setGroups((prevGroups) => {
        // Only update if the groups have actually changed
        const groupsChanged =
          JSON.stringify(prevGroups) !== JSON.stringify(formattedGroups);
        return groupsChanged ? formattedGroups : prevGroups;
      });

      // If the current selected group is not in the new groups list, reset it
      const currentGroupId = selectedGroup;
      if (currentGroupId && currentGroupId !== "all") {
        const groupExists = formattedGroups.some(
          (g) => g.group_id === currentGroupId,
        );
        if (!groupExists) {
          setSelectedGroup("all");
          // Update URL to remove group filter
          const params = new URLSearchParams(window.location.search);
          params.delete("group");
          navigate(`?${params.toString()}`, { replace: true });
        }
      }

      return formattedGroups;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Groups request was canceled:", error.message);
        return [];
      }

      console.error("Error fetching groups with prices:", error);

      let errorMessage = "Error al cargar los grupos";
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);
        errorMessage = `Error ${error.response.status}: ${error.response.statusText || "Error del servidor"}`;
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "No se recibió respuesta del servidor";
      } else {
        console.error("Error setting up request:", error.message);
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
      setGroups([]);
      setSelectedGroup("all");
      return [];
    }
  };

  // Fetch data when component mounts or when filters change
  useEffect(() => {
    if (user) {
      // Fetch groups for the selected region
      fetchGroups(selectedRegion);

      // Always fetch region averages when selectedRegion changes
      fetchRegionAverages(selectedRegion);

      // Fetch brand stats with current filters
      fetchBrandStats(selectedRegion, selectedGroup);
    }
  }, [user, selectedRegion, selectedGroup]);

  // Fetch product data when selectedRegion changes
  useEffect(() => {
    let isMounted = true;

    // Don't fetch if regions are still loading
    if (!regions || regions.length === 0) {
      return;
    }

    // Skip initial render if no region is selected yet
    if (selectedRegion === undefined || selectedRegion === "") {
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);

        // If no region is selected or 'all' is selected, fetch data for all regions
        if (selectedRegion === "all") {
          // Fetch data for each region in parallel
          const fetchPromises = regions.map(async (region) => {
            if (!isMounted) return [];
            try {
              const response = await axios.get(
                `${API_URL}/overview/${region.region_id}`,
                {
                  timeout: 10000,
                  headers: {
                    "Cache-Control": "no-cache",
                  },
                },
              );
              // Handle new consistent response format
              const data = response.data.success
                ? response.data.data
                : response.data;
              return Array.isArray(data) ? data : [];
            } catch (err) {
              console.error(
                "Error fetching data for region",
                region.region_id,
                err,
              );
              return [];
            }
          });

          const allResults = await Promise.all(fetchPromises);
          const allProducts = allResults.flat();

          if (allProducts.length > 0) {
            processAllProductsData(allProducts);
          } else {
            setProductData([]);
          }
        } else {
          // Fetch data for a specific region
          const response = await axios.get(
            `${API_URL}/overview/${selectedRegion}`,
          );

          if (response.data) {
            // Handle new consistent response format
            const data = response.data.success
              ? response.data.data
              : response.data;
            if (Array.isArray(data) && data.length > 0) {
              processProductData(data, selectedRegion);
            } else {
              setProductData([]);
            }
          } else {
            setProductData([]);
          }
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("Error al cargar los datos");
        setProductData([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Execute fetchData immediately
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedRegion, regions]);

  // Process product data for a specific region
  const processProductData = (data, regionId) => {
    try {
      if (!Array.isArray(data)) {
        throw new Error("Datos no son un arreglo");
      }

      const productGroups = {};

      // Process each item in the data
      data.forEach((item) => {
        try {
          const productKey = `${item.product_id}_${item.brand_id}_${item.group_id}`;

          if (!productGroups[productKey]) {
            productGroups[productKey] = {
              product_id: item.product_id,
              product_name: item.product_name || "Sin nombre",
              brand_id: item.brand_id,
              brand_name: item.brand_name || "Sin marca",
              group_id: item.group_id,
              group_name: item.group_name || "Sin grupo",
              region_id: regionId,
              region_name:
                regions.find((r) => r.region_id === regionId)?.region_name ||
                "Sin región",
              prices: [],
            };
          }

          if (item.price_amount) {
            productGroups[productKey].prices.push({
              price_id: item.price_id,
              price_amount: parseFloat(item.price_amount),
              price_date: item.price_date,
              store_id: item.store_id,
              store_name: item.store_name || "Tienda desconocida",
            });
          }
        } catch (error) {
          // Silently handle item processing errors
        }
      });

      // Calculate average price for each product
      const processedData = Object.values(productGroups).map((product) => {
        const validPrices = product.prices.filter(
          (p) => !isNaN(p.price_amount),
        );
        const avgPrice =
          validPrices.length > 0
            ? validPrices.reduce((sum, p) => sum + p.price_amount, 0) /
              validPrices.length
            : 0;

        return {
          ...product,
          average_price: avgPrice,
          price_count: validPrices.length,
        };
      });

      // Sort by group name and then by product name
      processedData.sort((a, b) => {
        if (a.group_name < b.group_name) return -1;
        if (a.group_name > b.group_name) return 1;
        if (a.product_name < b.product_name) return -1;
        if (a.product_name > b.product_name) return 1;
        return 0;
      });

      setProductData(processedData);
    } catch (error) {
      setProductData([]);
    }
  };

  // Fetch overview data for a specific region
  const fetchOverviewData = async (regionId) => {
    if (!regionId) return;

    try {
      setError(null);
      const response = await axios.get(`${API_URL}/overview/${regionId}`);

      if (response.data) {
        // Handle new consistent response format
        const data = response.data.success ? response.data.data : response.data;
        if (Array.isArray(data) && data.length > 0) {
          processProductData(data, regionId);
        } else {
          setProductData([]);
        }
      } else {
        setProductData([]);
      }
    } catch (err) {
      setError("Error al cargar los datos de la región");
      setProductData([]);
    }
  };

  // Process all products data (for 'Todas las regiones')
  const processAllProductsData = (products) => {
    try {
      if (!Array.isArray(products)) {
        throw new Error("Los datos de productos deben ser un arreglo");
      }

      const productGroups = {};
      const uniqueGroups = {};
      const allRegions = [...new Set(products.map((p) => p.region_id))];

      // Process each product
      products.forEach((product) => {
        try {
          const productKey = `${product.product_id}_${product.brand_id}_${product.group_id}`;

          // Track unique groups
          if (product.group_id && product.group_name) {
            uniqueGroups[product.group_id] = product.group_name;
          }

          if (!productGroups[productKey]) {
            productGroups[productKey] = {
              product_id: product.product_id,
              product_name: product.product_name || "Sin nombre",
              brand_id: product.brand_id,
              brand_name: product.brand_name || "Sin marca",
              group_id: product.group_id,
              group_name: product.group_name || "Sin grupo",
              region_id: "all",
              region_name: "Todas las regiones",
              prices: [],
            };
          }

          if (product.price_amount) {
            productGroups[productKey].prices.push({
              price_amount: parseFloat(product.price_amount),
              store_id: product.store_id,
              region_id: product.region_id,
            });
          }
        } catch (error) {
          // Silently handle item processing errors
        }
      });

      // Calculate average price for each product across all regions
      const processedData = Object.values(productGroups).map((product) => {
        const validPrices = product.prices.filter(
          (p) => !isNaN(p.price_amount),
        );
        const avgPrice =
          validPrices.length > 0
            ? validPrices.reduce((sum, p) => sum + p.price_amount, 0) /
              validPrices.length
            : 0;

        return {
          ...product,
          average_price: avgPrice,
          price_count: validPrices.length,
          region_count: new Set(validPrices.map((p) => p.region_id)).size,
        };
      });

      // Update groups state
      const groupsArray = Object.entries(uniqueGroups).map(([id, name]) => ({
        id: id,
        name: name || "Sin grupo",
      }));

      // Sort groups alphabetically
      groupsArray.sort((a, b) => a.name.localeCompare(b.name));
      setGroups(groupsArray);

      // Set the processed data
      setProductData(processedData);
    } catch (error) {
      setError("Error al procesar los datos de productos.");
      setProductData([]);
    } finally {
      setLoading(false);
    }
  };

  // Format price with VES currency
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return "N/A";
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Handle region change
  const handleRegionChange = (e) => {
    e.preventDefault();
    const newRegionId = e.target.value;

    // Only update if the region actually changed
    if (newRegionId !== selectedRegion) {
      setSelectedRegion(newRegionId);
      // Reset filters only if a specific region is selected
      if (newRegionId !== "all") {
        setSelectedGroup("all");
        setSearchTerm("");
      }

      // Update URL with the new region and reset group
      const params = new URLSearchParams(window.location.search);
      if (newRegionId === "all") {
        params.delete("region");
      } else {
        params.set("region", newRegionId);
      }
      params.delete("group");
      navigate(`?${params.toString()}`, { replace: true });

      // Fetch fresh data for the new region
      fetchRegionAverages(newRegionId);
      fetchBrandStats(newRegionId, "all");
      fetchGroups(newRegionId);
    }
  };

  // Debug function to log the structure of the data
  const logDataStructure = (data, depth = 0) => {
    if (depth > 3) return "...";
    if (Array.isArray(data)) {
      return data.length > 0 ? logDataStructure(data[0], depth + 1) : "[]";
    } else if (data && typeof data === "object") {
      return Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = logDataStructure(value, depth + 1);
        return acc;
      }, {});
    }
    return typeof data;
  };

  // Process group averages data by group and product
  const getGroupAverages = (data, regions) => {
    if (!data || !Array.isArray(data)) return [];

    // Usaremos un Map para agrupar por grupo y luego por producto
    const groupedByGroup = new Map();

    data.forEach((item) => {
      if (!item) return;

      const groupName = item.grupo || item.group_name || "Sin grupo";
      const productName = item.producto || item.product_name || "Sin nombre";
      const price = parseFloat(item.precio_promedio) || 0;
      const regionId = item.region_id || "";

      // Obtener nombre de la región
      let regionName = "Sin región";
      if (Array.isArray(regions)) {
        const region = regions.find(
          (r) => r && (r.region_id == regionId || r.id == regionId),
        );
        if (region) {
          regionName =
            region.region_name || region.name || `Región ${regionId}`;
        }
      }
      regionName = item.region || regionName;

      // Inicializar el grupo si no existe
      if (!groupedByGroup.has(groupName)) {
        groupedByGroup.set(groupName, {
          groupName,
          products: new Map(), // Usamos Map para los productos
        });
      }

      const group = groupedByGroup.get(groupName);
      const productKey = `${productName}-${regionId}`; // Clave única para el producto en esta región

      // Agregar o actualizar el producto
      if (!group.products.has(productKey)) {
        group.products.set(productKey, {
          name: productName,
          prices: [],
          region: regionName,
          region_id: regionId,
        });
      }

      const product = group.products.get(productKey);
      if (!isNaN(price) && price > 0) {
        product.prices.push(price);
      }
    });

    // Procesar los resultados
    const result = [];

    groupedByGroup.forEach((group) => {
      group.products.forEach((product) => {
        if (product.prices.length > 0) {
          const avgPrice =
            product.prices.reduce((sum, price) => sum + price, 0) /
            product.prices.length;

          result.push({
            grupo: group.groupName,
            producto: product.name,
            region: product.region,
            region_id: product.region_id,
            precio_promedio: parseFloat(avgPrice.toFixed(2)),
            // Mantener compatibilidad con el formato anterior
            productos: [
              {
                nombre: product.name,
                precio: parseFloat(avgPrice.toFixed(2)),
              },
            ],
          });
        }
      });
    });

    // Ordenar por grupo y luego por producto
    return result.sort((a, b) => {
      if (a.grupo !== b.grupo) return a.grupo.localeCompare(b.grupo);
      return a.producto.localeCompare(b.producto);
    });
  };

  // Get prices grouped by region, group, and product
  const getGroupedPricesByRegion = useMemo(() => {
    if (!regionAverages || !Array.isArray(regionAverages)) return [];

    // First, group by region and group
    const groupedByRegionAndGroup = regionAverages.reduce((acc, item) => {
      // Skip items without required data
      if (!item.region_id || !item.group_id) return acc;

      const regionKey = item.region_id;
      const groupKey = `${regionKey}-${item.group_id}`;

      // Initialize region if not exists
      if (!acc[regionKey]) {
        acc[regionKey] = {
          region_id: item.region_id,
          region: item.region_name || "Sin región",
          grupos: {},
        };
      }

      // Initialize group if not exists
      if (!acc[regionKey].grupos[groupKey]) {
        acc[regionKey].grupos[groupKey] = {
          group_id: item.group_id,
          group_name: item.group_name || "Sin grupo",
          productos: [],
        };
      }

      // Add product to the group if it has a valid name and price
      if (
        item.product_id &&
        item.product_name &&
        item.average_price !== undefined
      ) {
        acc[regionKey].grupos[groupKey].productos.push({
          product_id: item.product_id,
          nombre: item.product_name,
          precio_promedio: parseFloat(item.average_price) || 0,
          tiendas: item.store_count || 0,
        });
      }

      return acc;
    }, {});

    // Convert to array format expected by the UI
    const result = [];

    Object.values(groupedByRegionAndGroup).forEach((region) => {
      Object.values(region.grupos).forEach((grupo) => {
        if (grupo.productos.length > 0) {
          result.push({
            region_id: region.region_id,
            region: region.region,
            grupo: grupo.group_name,
            group_id: grupo.group_id,
            productos: grupo.productos.sort((a, b) =>
              (a.nombre || "").localeCompare(b.nombre || ""),
            ),
          });
        }
      });
    });

    // Sort by region and group name
    return result.sort((a, b) => {
      if (a.region !== b.region)
        return (a.region || "").localeCompare(b.region || "");
      return (a.grupo || "").localeCompare(b.grupo || "");
    });
  }, [regionAverages]);

  // Group prices by group and product
  const getGroupedPrices = useMemo(() => {
    if (!regionAverages || regionAverages.length === 0) {
      return [];
    }

    return getGroupedPricesByRegion;
  }, [getGroupedPricesByRegion]);
  // Filter and sort the grouped prices for display
  const filteredGroupedPrices = useMemo(() => {
    if (!getGroupedPrices || getGroupedPrices.length === 0) {
      return [];
    }

    let filtered = [...getGroupedPrices];

    // Apply region filter if selected
    if (selectedRegion && selectedRegion !== "all") {
      filtered = filtered.filter(
        (item) => String(item.region_id) === String(selectedRegion),
      );
    }

    // Apply group filter if selected
    if (selectedGroup && selectedGroup !== "all") {
      filtered = filtered.filter((item) => item.grupo === selectedGroup);
    }

    // Apply search filter if present
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.region && item.region.toLowerCase().includes(term)) ||
          (item.grupo && item.grupo.toLowerCase().includes(term)),
      );
    }
    return filtered;
  }, [getGroupedPrices, selectedRegion, selectedGroup, searchTerm]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle group change
  const handleGroupChange = (e) => {
    const value = e.target.value;
    setSelectedGroup(value);

    // Update URL parameters
    const params = new URLSearchParams(window.location.search);
    if (value === "all" || value === "") {
      params.delete("group");
    } else {
      params.set("group", value);
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Apply filters to the region averages data
  const filterRegionAverages = () => {
    if (!Array.isArray(regionAverages)) return [];

    const searchLower = searchTerm?.toLowerCase() || "";
    const selectedGroupInfo =
      selectedGroup && selectedGroup !== "all"
        ? groups.find((g) => g.group_id === selectedGroup)
        : null;

    // Process region names from the regions state
    const processedAverages = regionAverages.map((item) => {
      let regionName = item.region || "Sin región";
      if (regionName === "Sin región" && item.region_id) {
        const region = regions.find((r) => r.region_id == item.region_id);
        if (region) {
          regionName = region.region_name || `Región ${item.region_id}`;
        }
      }
      return {
        ...item,
        region: regionName,
      };
    });

    let result = [...processedAverages];

    try {
      // Filter by region if selected
      if (selectedRegion && selectedRegion !== "") {
        // If 'all' regions is selected, don't filter by region
        if (selectedRegion === "all") {
          // Include all items, but prioritize items with specific region_id
          result = result.filter(
            (item) => item.region_id !== undefined && item.region_id !== null,
          );
        } else {
          result = result.filter(
            (item) =>
              item.region_id &&
              item.region_id.toString() === selectedRegion.toString(),
          );
        }
      }

      // Filter by group if selected (and not 'all')
      if (selectedGroup && selectedGroup !== "" && selectedGroup !== "all") {
        result = result.filter(
          (item) =>
            item.group_id &&
            item.group_id.toString() === selectedGroup.toString(),
        );
      }

      // Filter by search term if provided
      if (searchTerm && searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase().trim();
        result = result.filter(
          (item) =>
            (item.product_name &&
              item.product_name.toLowerCase().includes(searchLower)) ||
            (item.group_name &&
              item.group_name.toLowerCase().includes(searchLower)) ||
            (item.brand_name &&
              item.brand_name.toLowerCase().includes(searchLower)),
        );
      }

      // Sort by group name and then by product name
      result.sort((a, b) => {
        if (a.group_name < b.group_name) return -1;
        if (a.group_name > b.group_name) return 1;
        if (a.product_name < b.product_name) return -1;
        if (a.product_name > b.product_name) return 1;
        return 0;
      });

      return result;
    } catch (error) {
      return [];
    }
  };

  // Memoize the filtered region averages to prevent unnecessary recalculations
  const filteredRegionAverages = useMemo(() => {
    if (!Array.isArray(regionAverages)) return [];

    const searchLower = searchTerm?.toLowerCase() || "";
    const selectedGroupInfo =
      selectedGroup && selectedGroup !== "all"
        ? groups.find((g) => g.group_id === selectedGroup)
        : null;

    // Process region names from the regions state
    const processedAverages = regionAverages.map((item) => {
      let regionName = item.region || "Sin región";
      if (regionName === "Sin región" && item.region_id) {
        const region = regions.find((r) => r.region_id == item.region_id);
        if (region) {
          regionName = region.region_name || `Región ${item.region_id}`;
        }
      }
      return {
        ...item,
        region: regionName,
      };
    });

    let result = [...processedAverages];

    try {
      // Filter by region if selected
      if (selectedRegion && selectedRegion !== "") {
        // If 'all' regions is selected, don't filter by region
        if (selectedRegion === "all") {
          // Include all items, but prioritize items with specific region_id
          result = result.filter(
            (item) => item.region_id !== undefined && item.region_id !== null,
          );
        } else {
          result = result.filter(
            (item) =>
              item.region_id &&
              item.region_id.toString() === selectedRegion.toString(),
          );
        }
      }

      // Filter by group if selected (and not 'all')
      if (selectedGroup && selectedGroup !== "" && selectedGroup !== "all") {
        result = result.filter(
          (item) =>
            item.group_id &&
            item.group_id.toString() === selectedGroup.toString(),
        );
      }

      // Filter by search term if provided
      if (searchTerm && searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase().trim();
        result = result.filter(
          (item) =>
            (item.product_name &&
              item.product_name.toLowerCase().includes(searchLower)) ||
            (item.group_name &&
              item.group_name.toLowerCase().includes(searchLower)) ||
            (item.brand_name &&
              item.brand_name.toLowerCase().includes(searchLower)),
        );
      }

      return result;
    } catch (error) {
      console.error("Error filtering region averages:", error);
      return [];
    }
  }, [regionAverages, regions, selectedRegion, selectedGroup, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  // Function to determine CSS class based on percentage value
  const getPercentageClass = (value) => {
    if (value > 0) return "text-red-600";
    if (value < 0) return "text-green-600";
    return "text-blue-600";
  };

  return (
    <div className="p-4 max-w-7xl mx-auto font-sans w-full">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 flex-wrap min-h-10">
            <span className="font-medium text-lg flex items-center min-w-20 text-gray-700">
              Región
              <FaMapMarkerAlt className="ml-2 text-lg text-blue-600" />
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedRegion === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-blue-600 border-gray-300 hover:bg-blue-50"
                } border-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                onClick={() =>
                  handleRegionChange({
                    target: { value: "all" },
                    preventDefault: () => {},
                  })
                }
                disabled={loading}
              >
                Todas las regiones
              </button>
              {Array.isArray(regions) &&
                regions.map((region) => (
                  <button
                    key={region.region_id}
                    type="button"
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedRegion === region.region_id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-blue-600 border-gray-300 hover:bg-blue-50"
                    } border-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    onClick={() =>
                      handleRegionChange({
                        target: { value: region.region_id },
                        preventDefault: () => {},
                      })
                    }
                    disabled={loading}
                  >
                    {region.region_name || `Región ${region.region_id}`}
                  </button>
                ))}
            </div>
          </div>
          {loading && (
            <span className="text-sm text-gray-500 mt-2">Cargando regiones...</span>
          )}
          {!loading && regions.length === 0 && (
            <span className="text-sm text-red-500 mt-2">No hay regiones disponibles</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Grid Item 1 - Precios Promedios por Grupo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Precios Promedios por Grupo
          </h3>
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <table className="w-full min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Grupo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Precio Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productGroupAverages.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500 italic">
                        {loading
                          ? "Cargando datos..."
                          : "No se encontraron precios promedios con los filtros seleccionados"}
                      </td>
                    </tr>
                  ) : (
                    [...productGroupAverages]
                      .sort((a, b) => {
                        if (a.product_name < b.product_name) return -1;
                        if (a.product_name > b.product_name) return 1;
                        if (a.group_name < b.group_name) return -1;
                        if (a.group_name > b.group_name) return 1;
                        return 0;
                      })
                      .map((item, index) => (
                        <tr
                          key={`item-${index}`}
                          className="hover:bg-blue-50 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {item.group_name || "Sin grupo"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.product_name || "Sin nombre"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono font-semibold">
                            {item.average_price > 0
                              ? `Bs.S ${parseFloat(item.average_price).toFixed(2)}`
                              : "N/A"}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Grid Item 2 - Precios Promedios por Región */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            Precios Promedios por Región
          </h3>
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <table className="w-full min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Región
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Grupo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Precio Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGroupedPrices.length > 0 ? (
                    filteredGroupedPrices.map((group, index) => {
                      const totalPrice = group.productos.reduce(
                        (sum, product) =>
                          sum + parseFloat(product.precio_promedio || 0),
                        0,
                      );
                      const averagePrice =
                        group.productos.length > 0
                          ? totalPrice / group.productos.length
                          : 0;
                      return (
                        <tr
                          key={`${group.region_id}-${group.group_id}-${index}`}
                          className="hover:bg-green-50 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {group.region || "Sin región"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {group.grupo || "Sin grupo"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono font-semibold">
                            {averagePrice > 0
                              ? formatPrice(averagePrice)
                              : "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500 italic">
                        No se encontraron precios promedios con los filtros
                        seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Brand Statistics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Estadísticas de Marcas
          </h3>
          <div className="flex-1 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <table className="w-full min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Marca
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      Precio Promedio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      N° Productos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                      % vs Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {brandStats.length > 0 ? (
                    brandStats.map((brand, index) => (
                      <tr
                        key={`${brand.brand}-${index}`}
                        className="hover:bg-purple-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {brand.brand || "Sin marca"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono font-semibold">
                          {formatPrice(brand.average_price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                          {brand.product_count || 0}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                          brand.vs_average_percentage > 0
                            ? "text-red-600"
                            : brand.vs_average_percentage < 0
                              ? "text-green-600"
                              : "text-blue-600"
                        }`}>
                          {brand.vs_average_percentage > 0 ? "+" : ""}
                          {brand.vs_average_percentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">
                        {loading
                          ? "Cargando estadísticas..."
                          : "No hay datos disponibles"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Grid Item 4 - Comparativa de Precios por Marca */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
            Comparativa de Precios por Marca
          </h3>
          <div className="flex-1 flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
            {topAndBottomBrands.length > 0 ? (
              <div className="w-full h-full p-4">
                <Bar
                  data={{
                    labels: topAndBottomBrands.map(
                      (brand) => brand.brand || "Sin nombre",
                    ),
                    datasets: [
                      {
                        label: "Precio Promedio",
                        data: topAndBottomBrands.map(
                          (brand) => brand.average_price || 0,
                        ),
                        backgroundColor: [
                          "rgba(255, 99, 132, 0.6)",
                          "rgba(54, 162, 235, 0.6)",
                          "rgba(255, 206, 86, 0.6)",
                          "rgba(75, 192, 192, 0.6)",
                          "rgba(153, 102, 255, 0.6)",
                        ],
                        borderColor: [
                          "rgba(255, 99, 132, 1)",
                          "rgba(54, 162, 235, 1)",
                          "rgba(255, 206, 86, 1)",
                          "rgba(75, 192, 192, 1)",
                          "rgba(153, 102, 255, 1)",
                        ],
                        borderWidth: 2,
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        callbacks: {
                          label: (context) => {
                            const brand =
                              topAndBottomBrands[context.dataIndex];
                            return [
                              `Precio: ${formatPrice(brand.average_price)}`,
                              `Productos: ${brand.product_count || 0}`,
                              `Segmento: ${brand.price_segment || "N/A"}`,
                              `vs Promedio: ${brand.vs_average_percentage > 0 ? "+" : ""}${brand.vs_average_percentage || 0}%`,
                            ];
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)',
                        },
                        title: {
                          display: true,
                          text: "Precio Promedio",
                          font: {
                            size: 12,
                            weight: 'bold',
                          },
                        },
                        ticks: {
                          callback: (value) => `$${value}`,
                          font: {
                            size: 11,
                          },
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: "Marcas",
                          font: {
                            size: 12,
                            weight: 'bold',
                          },
                        },
                        ticks: {
                          font: {
                            size: 11,
                          },
                          maxRotation: 45,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                {loading
                  ? "Cargando datos del gráfico..."
                  : "No hay suficientes datos para mostrar el gráfico"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
