# 📊 Radar Precios

Aplicación **Fullstack (Node.js + React)** para el monitoreo de precios por región y marca.  
El proyecto está dividido en dos partes: **backend** (API en Node/Express) y **frontend** (dashboard en React).

---

## 🚀 Tecnologías

- **Backend**
  - Node.js
  - Express
  - PostgreSQL / MySQL
  - JWT (autenticación)

- **Frontend**
  - React
  - Vite
  - Tailwind CSS
  - Chart.js (visualización de datos)

---

## 📂 Estructura del Proyecto
```
radarprecios-node-react/
│
├── backend/ # API en Node.js
│ ├── src/
│ ├── package.json
│ └── .env.example
│
├── frontend/ # Dashboard en React
│ ├── src/
│ ├── package.json
│ └── .env.example
│
└── README.md
```
---

## ⚙️ Configuración

### 1. Clonar el repositorio
```
git clone git@github.com:Mirko-Perez/radarprecios-node-react.git
cd radarprecios-node-react
```
2. Variables de entorno

Copiar los archivos .env.example y crear los .env con tus valores:

Backend (backend/.env)
```
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=
DB_NAME=radarprecios
JWT_SECRET=
```

Frontend (frontend/.env)
```
VITE_API_URL=
```

3. Instalar dependencias

# Backend
```
cd backend
npm install
```
# Frontend
```
cd frontend
npm install
```
4. Levantar los servicios

# Backend
```
npm run start
```
# Frontend
```
npm run dev
```
