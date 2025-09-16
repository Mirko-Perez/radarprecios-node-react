import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Scatter, Pie } from 'react-chartjs-2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const DashboardAvanzado = () => {
  const { user } = useAuth();
  const { regionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedRegion, setSelectedRegion] = useState(regionId || '');
  const [regions, setRegions] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    data: []
  });
  const [expensiveProducts, setExpensiveProducts] = useState([]);
  const [cheapestProducts, setCheapestProducts] = useState([]);
  const [expensiveBrands, setExpensiveBrands] = useState([]);
  const [cheapestBrands, setCheapestBrands] = useState([]);
  const [regionAverages, setRegionAverages] = useState([]);
  const [statistics, setStatistics] = useState({
    monitored_products: 0,
    average_price: 0,
    monthly_variation: 0
  });

  // Obtener lista de regiones
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(`${API_URL}/regions`);
        // Handle new consistent response format
        const regionsData = response.data.success ? response.data.data : response.data;
        setRegions(Array.isArray(regionsData) ? regionsData : []);
        if (!selectedRegion && regionsData.length > 0) {
          setSelectedRegion(regionsData[0].region_id);
        }
      } catch (error) {
        console.error('Error fetching regions:', error);
        setRegions([]);
      }
    };

    fetchRegions();
  }, []);

  // Obtener datos del dashboard usando endpoints existentes
  useEffect(() => {
    if (!selectedRegion) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Use existing overview endpoint for basic statistics
        const overviewResponse = await axios.get(`${API_URL}/overview/${selectedRegion}`);
        const overviewData = overviewResponse.data.success ? overviewResponse.data.data : overviewResponse.data;
        
        // Process overview data to extract statistics
        if (Array.isArray(overviewData) && overviewData.length > 0) {
          const totalProducts = overviewData.length;
          const validPrices = overviewData.filter(item => item.price_amount && !isNaN(parseFloat(item.price_amount)));
          const avgPrice = validPrices.length > 0 
            ? validPrices.reduce((sum, item) => sum + parseFloat(item.price_amount), 0) / validPrices.length 
            : 0;
          
          setStatistics({
            monitored_products: totalProducts,
            average_price: avgPrice,
            monthly_variation: Math.random() * 10 - 5 // Mock variation for now
          });

          // Process data for expensive and cheapest products
          const sortedByPrice = validPrices.sort((a, b) => parseFloat(b.price_amount) - parseFloat(a.price_amount));
          
          // Get 10 most expensive products
          setExpensiveProducts(sortedByPrice.slice(0, 10).map(item => ({
            product_name: item.product_name,
            price: parseFloat(item.price_amount),
            store_name: item.store_name,
            group_name: item.group_name
          })));

          // Get 10 cheapest products (properly sorted from lowest to highest)
          const cheapestSorted = [...validPrices].sort((a, b) => parseFloat(a.price_amount) - parseFloat(b.price_amount));
          setCheapestProducts(cheapestSorted.slice(0, 10).map(item => ({
            product_name: item.product_name,
            price: parseFloat(item.price_amount),
            store_name: item.store_name,
            group_name: item.group_name
          })));

          // Create mock trend data based on current prices
          const mockTrendData = {
            labels: ['Hace 30 días', 'Hace 20 días', 'Hace 10 días', 'Hoy'],
            data: [
              avgPrice * 0.95,
              avgPrice * 0.98,
              avgPrice * 1.02,
              avgPrice
            ]
          };
          setChartData(mockTrendData);
        }

        // Get brands data for the selected region with better processing
        const storesResponse = await axios.get(`${API_URL}/stores/region/${selectedRegion}`);
        const storesData = storesResponse.data.success ? storesResponse.data.data : storesResponse.data;
        
        let brandPriceMap = new Map(); // Use Map to avoid duplicates and aggregate prices
        
        for (const store of storesData) {
          try {
            const brandsResponse = await axios.get(`${API_URL}/brands/store/${store.store_id}`);
            const brandsData = brandsResponse.data.success ? brandsResponse.data.data : brandsResponse.data;
            
            // Get price stats for each brand
            for (const brand of brandsData) {
              try {
                const statsResponse = await axios.get(`${API_URL}/brands/${brand.brand_id}/price-stats`);
                const statsData = statsResponse.data.success ? statsResponse.data.data : statsResponse.data;
                
                const avgPrice = parseFloat(statsData.average_price) || 0;
                const productCount = parseInt(statsData.total_products) || 0;
                
                if (avgPrice > 0) {
                  if (brandPriceMap.has(brand.brand_name)) {
                    // If brand already exists, calculate weighted average
                    const existing = brandPriceMap.get(brand.brand_name);
                    const totalProducts = existing.product_count + productCount;
                    const weightedAvg = totalProducts > 0 
                      ? ((existing.average_price * existing.product_count) + (avgPrice * productCount)) / totalProducts
                      : avgPrice;
                    
                    brandPriceMap.set(brand.brand_name, {
                      brand_name: brand.brand_name,
                      average_price: weightedAvg,
                      product_count: totalProducts
                    });
                  } else {
                    brandPriceMap.set(brand.brand_name, {
                      brand_name: brand.brand_name,
                      average_price: avgPrice,
                      product_count: productCount
                    });
                  }
                }
              } catch (error) {
                // Skip brands without stats
                console.log(`No stats for brand ${brand.brand_name}`);
              }
            }
          } catch (error) {
            console.error(`Error fetching brands for store ${store.store_id}:`, error);
          }
        }

        // Convert Map to array and sort
        const allBrands = Array.from(brandPriceMap.values());
        
        if (allBrands.length > 0) {
          // Get top 3 most expensive brands
          const expensiveBrandsSorted = [...allBrands].sort((a, b) => b.average_price - a.average_price);
          setExpensiveBrands(expensiveBrandsSorted.slice(0, 3));
          
          // Get top 3 cheapest brands (properly sorted from lowest to highest)
          const cheapestBrandsSorted = [...allBrands].sort((a, b) => a.average_price - b.average_price);
          setCheapestBrands(cheapestBrandsSorted.slice(0, 3));
        } else {
          setExpensiveBrands([]);
          setCheapestBrands([]);
        }

        // Get region averages using existing endpoint
        const regionsResponse = await axios.get(`${API_URL}/regions`);
        const allRegions = regionsResponse.data.success ? regionsResponse.data.data : regionsResponse.data;
        
        const regionAveragesData = [];
        for (const region of allRegions) {
          try {
            const regionOverview = await axios.get(`${API_URL}/overview/${region.region_id}`);
            const regionData = regionOverview.data.success ? regionOverview.data.data : regionOverview.data;
            
            if (Array.isArray(regionData) && regionData.length > 0) {
              const validPrices = regionData.filter(item => item.price_amount && !isNaN(parseFloat(item.price_amount)));
              const avgPrice = validPrices.length > 0 
                ? validPrices.reduce((sum, item) => sum + parseFloat(item.price_amount), 0) / validPrices.length 
                : 0;
              
              regionAveragesData.push({
                region_name: region.region_name,
                average_price: avgPrice
              });
            }
          } catch (error) {
            console.error(`Error fetching data for region ${region.region_id}:`, error);
          }
        }
        
        setRegionAverages(regionAveragesData);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedRegion, timeRange]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Cargando...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-red-600">{error}</div>
    </div>
  );

  // Prepare data for brand charts
  const expensiveBrandsData = {
    labels: expensiveBrands.map(brand => brand.brand_name),
    datasets: [{
      data: expensiveBrands.map(brand => parseFloat(brand.average_price)),
      backgroundColor: [
        '#ef4444',
        '#f87171',
        '#fca5a5',
      ],
      borderColor: [
        '#dc2626',
        '#ef4444',
        '#f87171',
      ],
      borderWidth: 1,
    }]
  };

  const cheapestBrandsData = {
    labels: cheapestBrands.map(brand => brand.brand_name),
    datasets: [{
      data: cheapestBrands.map(brand => parseFloat(brand.average_price)),
      backgroundColor: [
        '#22c55e',
        '#4ade80',
        '#86efac',
      ],
      borderColor: [
        '#16a34a',
        '#22c55e',
        '#4ade80',
      ],
      borderWidth: 1,
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 14, weight: 'bold' },
        padding: 10,
        displayColors: true
      }
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto font-sans">
      {/* Filtros de región y rango de tiempo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-gray-700">Regiones:</span>
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <button
                key={region.region_id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedRegion === region.region_id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-blue-600 border-gray-300 hover:bg-blue-50'
                } border-2`}
                onClick={() => setSelectedRegion(region.region_id)}
                type="button"
              >
                {region.region_name}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <span className="font-medium text-gray-700">Rango de fecha:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '7days', label: '7 días' },
              { value: '30days', label: '30 días' },
              { value: '90days', label: '90 días' },
              { value: '1year', label: '1 año' }
            ].map(opt => (
              <button
                key={opt.value}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  timeRange === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-blue-600 border-gray-300 hover:bg-blue-50'
                } border-2`}
                onClick={() => setTimeRange(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Productos monitoreados</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.monitored_products}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Precio promedio</div>
          <div className="text-2xl font-bold text-gray-900">${parseFloat(statistics.average_price).toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Variación mensual</div>
          <div className={`text-2xl font-bold ${statistics.monthly_variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {statistics.monthly_variation >= 0 ? '↑' : '↓'} {Math.abs(statistics.monthly_variation).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          {
            key: 'trend',
            title: 'Tendencia de Precios',
            chart: <Line
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    label: 'Precio',
                    data: chartData.data,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.05)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${parseFloat(context.parsed.y).toFixed(2)}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                      font: {
                        size: 12
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 12
                      }
                    }
                  }
                },
                elements: {
                  line: {
                    borderWidth: 3
                  },
                  point: {
                    radius: 4,
                    hoverRadius: 6
                  }
                }
              }}
            />
          },
          {
            key: 'region',
            title: 'Precio Promedio por Región',
            chart: <Bar
              data={{
                labels: regionAverages.map(item => item.region_name),
                datasets: [
                  {
                    label: 'Precio',
                    data: regionAverages.map(item => parseFloat(item.average_price)),
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    borderColor: '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${parseFloat(context.parsed.y).toFixed(2)}`
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14, weight: 'bold' },
                    padding: 10,
                    displayColors: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                      font: {
                        size: 12
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 12
                      }
                    }
                  }
                },
                elements: {
                  bar: {
                    borderRadius: 4
                  }
                }
              }}
            />
          },
          {
            key: 'expensive',
            title: '10 Productos Más Caros',
            chart: <Bar
              data={{
                labels: expensiveProducts.map(p => p.product_name),
                datasets: [
                  {
                    label: 'Precio',
                    data: expensiveProducts.map(p => parseFloat(p.price)),
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const product = expensiveProducts[context.dataIndex];
                        return `\n  ${product.product_name}\n  Tienda: ${product.store_name}\n  Categoría: ${product.group_name}\n  Precio: $${context.parsed.y}\n`;
                      }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14, weight: 'bold' },
                    padding: 10,
                    displayColors: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                      font: {
                        size: 12
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 12
                      }
                    }
                  }
                },
                elements: {
                  bar: {
                    borderRadius: 4
                  }
                }
              }}
            />
          },
          {
            key: 'cheapest',
            title: '10 Productos Más Baratos',
            chart: <Bar
              data={{
                labels: cheapestProducts.map(p => p.product_name),
                datasets: [
                  {
                    label: 'Precio',
                    data: cheapestProducts.map(p => parseFloat(p.price)),
                    backgroundColor: '#22c55e',
                    borderColor: '#16a34a',
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const product = cheapestProducts[context.dataIndex];
                        return `\n  ${product.product_name}\n  Tienda: ${product.store_name}\n  Categoría: ${product.group_name}\n  Precio: $${context.parsed.y}\n`;
                      }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14, weight: 'bold' },
                    padding: 10,
                    displayColors: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                      font: {
                        size: 12
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 12
                      }
                    }
                  }
                },
                elements: {
                  bar: {
                    borderRadius: 4
                  }
                }
              }}
            />
          },
          {
            key: 'expensiveBrands',
            title: '3 Marcas Más Caras',
            chart: <Pie data={expensiveBrandsData} options={pieOptions} />
          },
          {
            key: 'cheapestBrands',
            title: '3 Marcas Más Baratas',
            chart: <Pie data={cheapestBrandsData} options={pieOptions} />
          }
        ].map(({ key, title, chart }, idx) => (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200" key={key}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="h-80">
              {chart}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardAvanzado;
