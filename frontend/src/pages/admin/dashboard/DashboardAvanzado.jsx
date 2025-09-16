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
import './DashboardAvanzado.css';

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



const brandChartOptions = {
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
      beginAtZero: true,
      ticks: {
        callback: (value) => `$${value}`
      }
    },
    x: {
      ticks: {
        autoSkip: false
      }
    }
  }
};

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

  // Obtener datos del dashboard
  useEffect(() => {
    if (!selectedRegion) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch statistics
        const statsResponse = await axios.get(`${API_URL}/prices/statistics`, {
          params: { region_id: selectedRegion }
        });
        // Handle new consistent response format
        const statsData = statsResponse.data.success ? statsResponse.data.data : statsResponse.data;
        setStatistics(statsData);

        // Fetch price trend data
        const trendResponse = await axios.get(`${API_URL}/prices/trend`, {
          params: {
            region_id: selectedRegion,
            time_range: timeRange
          }
        });
        // Handle new consistent response format
        const trendData = trendResponse.data.success ? trendResponse.data.data : trendResponse.data;
        setChartData(trendData);

        // Fetch most expensive products
        const expensiveResponse = await axios.get(`${API_URL}/prices/most-expensive`, {
          params: {
            region_id: selectedRegion,
            limit: 10
          }
        });
        // Handle new consistent response format
        const expensiveData = expensiveResponse.data.success ? expensiveResponse.data.data : expensiveResponse.data;
        setExpensiveProducts(expensiveData);

        // Fetch cheapest products
        const cheapestResponse = await axios.get(`${API_URL}/prices/cheapest`, {
          params: {
            region_id: selectedRegion,
            limit: 10
          }
        });
        // Handle new consistent response format
        const cheapestData = cheapestResponse.data.success ? cheapestResponse.data.data : cheapestResponse.data;
        setCheapestProducts(cheapestData);

        // Fetch expensive brands
        const expensiveBrandsResponse = await axios.get(`${API_URL}/prices/most-expensive-brands`, {
          params: {
            region_id: selectedRegion,
            limit: 3
          }
        });
        // Handle new consistent response format
        const expensiveBrandsData = expensiveBrandsResponse.data.success ? expensiveBrandsResponse.data.data : expensiveBrandsResponse.data;
        setExpensiveBrands(expensiveBrandsData);

        // Fetch cheapest brands
        const cheapestBrandsResponse = await axios.get(`${API_URL}/prices/cheapest-brands`, {
          params: {
            region_id: selectedRegion,
            limit: 3
          }
        });
        // Handle new consistent response format
        const cheapestBrandsData = cheapestBrandsResponse.data.success ? cheapestBrandsResponse.data.data : cheapestBrandsResponse.data;
        setCheapestBrands(cheapestBrandsData);

        // Fetch average prices by region
        const regionAveragesResponse = await axios.get(`${API_URL}/prices/average-by-region`, {
          params: {
            time_range: timeRange
          }
        });
        // Handle new consistent response format
        const regionAveragesData = regionAveragesResponse.data.success ? regionAveragesResponse.data.data : regionAveragesResponse.data;
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

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

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
    <div className="dashboard-avanzado">
      {/* Filtros de región y rango de tiempo, sin botón volver ni título */}
      <div className="dashboard-header dashboard-header-horizontal">
        <div className="dashboard-filters-horizontal">
          <span className="filter-label">Regiones:</span>
          <div className="filter-btn-group">
            {regions.map(region => (
              <button
                key={region.region_id}
                className={`filter-btn${selectedRegion === region.region_id ? ' selected' : ''}`}
                onClick={() => setSelectedRegion(region.region_id)}
                type="button"
              >
                {region.region_name}
              </button>
            ))}
          </div>
          <span className="filter-separator" />
          <span className="filter-label">Rango de fecha:</span>
          <div className="filter-btn-group">
            {[
              { value: '7days', label: '7 días' },
              { value: '30days', label: '30 días' },
              { value: '90days', label: '90 días' },
              { value: '1year', label: '1 año' }
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-btn${timeRange === opt.value ? ' selected' : ''}`}
                onClick={() => setTimeRange(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="statistics-bar">
        <div className="stat-item">
          <span className="stat-label">Productos monitoreados</span>
          <span className="stat-value">{statistics.monitored_products}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Precio promedio</span>
          <span className="stat-value">${parseFloat(statistics.average_price).toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Variación mensual</span>
          <span className={`stat-value ${statistics.monthly_variation >= 0 ? 'positive' : 'negative'}`}>
            {statistics.monthly_variation >= 0 ? '↑' : '↓'} {Math.abs(statistics.monthly_variation).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="dashboard-avanzado-grid">
        {/* Renderizar los gráficos en un array para asegurar filas de 4 */}
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
          <div className="dashboard-avanzado-card dashboard-avanzado-chart-card" key={key}>
            <h2>{title}</h2>
            <div className="dashboard-avanzado-chart-container" style={{ height: key === 'region' ? '400px' : '300px' }}>
              {chart}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardAvanzado;
