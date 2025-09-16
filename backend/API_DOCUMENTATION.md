# API Documentation - Radar Precios

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "message": "Description of the result",
  "data": {} // Response data (when applicable)
}
```

---

## 🏢 Regions API

### GET /api/regions
Get all regions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "region_id": 1,
      "region_name": "Capital",
      "description": "Región Capital"
    }
  ]
}
```

### GET /api/regions/:id
Get region by ID.

**Parameters:**
- `id` (path): Region ID

**Response:**
```json
{
  "success": true,
  "data": {
    "region_id": 1,
    "region_name": "Capital",
    "description": "Región Capital"
  }
}
```

### POST /api/regions
Create new region.

**Body:**
```json
{
  "region_name": "Nueva Región",
  "description": "Descripción opcional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Región creada exitosamente",
  "data": {
    "region_id": 7,
    "region_name": "Nueva Región",
    "description": "Descripción opcional"
  }
}
```

### PUT /api/regions/:id
Update region.

**Parameters:**
- `id` (path): Region ID

**Body:**
```json
{
  "region_name": "Región Actualizada",
  "description": "Nueva descripción"
}
```

### DELETE /api/regions/:id
Delete region.

**Parameters:**
- `id` (path): Region ID

---

## 📦 Groups API

### GET /api/groups
Get all product groups.

### GET /api/groups/:id
Get group by ID.

### POST /api/groups
Create new group.

**Body:**
```json
{
  "group_name": "Nuevo Grupo",
  "description": "Descripción opcional"
}
```

### PUT /api/groups/:id
Update group.

### DELETE /api/groups/:id
Delete group.

---

## 🏪 Stores API

### GET /api/stores
Get all stores.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "store_id": 1,
      "store_name": "Supermercado Central",
      "region_id": 1,
      "region_name": "Capital",
      "address": "Av. Principal 123",
      "segmento": "Retail",
      "ciudad": "Caracas"
    }
  ]
}
```

### GET /api/stores/region/:region_id
Get stores by region.

**Parameters:**
- `region_id` (path): Region ID

### GET /api/stores/:id
Get store by ID.

### POST /api/stores
Create new store.

**Body:**
```json
{
  "store_name": "Nuevo Comercio",
  "region_id": 1,
  "address": "Dirección opcional",
  "co_cli": "Código cliente opcional",
  "segmento": "Segmento opcional",
  "ciudad": "Ciudad opcional"
}
```

### PUT /api/stores/:id
Update store.

### DELETE /api/stores/:id
Soft delete store.

---

## 🏷️ Brands API

### GET /api/brands
Get all brands.

**Query Parameters:**
- `store_id` (optional): Filter by store ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "brand_id": 1,
      "brand_name": "Marca Premium",
      "store_id": 1,
      "store_name": "Supermercado Central"
    }
  ]
}
```

### GET /api/brands/stats
Get brand price statistics.

**Query Parameters:**
- `regionId`: Region ID or 'all'
- `groupId` (optional): Group ID

### GET /api/brands/store/:storeId
Get brands by store.

### GET /api/brands/:id
Get brand by ID.

### POST /api/brands
Create new brand.

**Body:**
```json
{
  "brand_name": "Nueva Marca",
  "store_id": 1
}
```

### PUT /api/brands/:id
Update brand.

### DELETE /api/brands/:id
Delete brand.

---

## 📱 Products API

### GET /api/products
Get all products with relationships.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "product_id": 1,
      "product_name": "Producto Ejemplo",
      "brand_id": 1,
      "brand_name": "Marca Premium",
      "group_id": 1,
      "group_name": "Categoría A",
      "region_id": 1,
      "region_name": "Capital",
      "imagen": "/images/producto.jpg",
      "is_valid": 1
    }
  ]
}
```

### GET /api/products/region/:region_id
Get products by region with detailed information.

**Parameters:**
- `region_id` (path): Region ID or 'all'

### GET /api/products/brand/:brand_id
Get products by brand.

### GET /api/products/:id
Get product by ID with statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "product_name": "Producto Ejemplo",
    "brand_name": "Marca Premium",
    "group_name": "Categoría A",
    "region_name": "Capital",
    "average_price": "15.50",
    "price_count": 5
  }
}
```

### POST /api/products
Create new product.

**Content-Type:** `multipart/form-data`

**Body:**
```json
{
  "product_name": "Nuevo Producto",
  "brand_id": 1,
  "group_id": 1,
  "region_id": 1,
  "imagen": "file upload (optional)"
}
```

### PUT /api/products/:id
Update product.

**Content-Type:** `multipart/form-data`

### PATCH /api/products/:product_id/status
Update product status.

**Body:**
```json
{
  "is_valid": true
}
```

### DELETE /api/products/:id
Delete product.

---

## 💰 Prices API

### GET /api/prices/averages
Get price averages by region.

**Query Parameters:**
- `region_id`: Region ID

### GET /api/prices/trend
Get price trends.

**Query Parameters:**
- `region_id`: Region ID
- `time_range`: '7days', '30days', '90days', 'year'

### GET /api/prices/most-expensive
Get most expensive products.

**Query Parameters:**
- `region_id`: Region ID
- `limit`: Number of results (default: 10)

### GET /api/prices/cheapest
Get cheapest products.

### GET /api/prices/statistics
Get price statistics for region.

### POST /api/prices
Add new price.

**Content-Type:** `multipart/form-data`

**Body:**
```json
{
  "product_id": 1,
  "store_id": 1,
  "price_amount": 15.50,
  "quantity": "1kg",
  "photo": "file upload (optional)"
}
```

---

## 👥 Admin API

### POST /api/admin/users
Create new user (Admin only).

**Body:**
```json
{
  "username": "nuevo_usuario",
  "password": "password123",
  "permission_id": 3
}
```

### GET /api/admin/users
List all users (Admin only).

### PATCH /api/admin/users/:userId/status
Update user status (Admin only).

**Body:**
```json
{
  "is_active": true
}
```

---

## 🔐 Authentication API

### POST /api/auth/login
User login.

**Body:**
```json
{
  "username": "usuario",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "usuario",
    "permissions": ["read", "write"],
    "permissionId": 3
  }
}
```

---

## 📊 Overview API

### GET /api/overview/stats
Get general statistics.

---

## 📝 Observations API

### GET /api/observations
Get all observations.

### POST /api/observations
Create new observation.

---

## 📍 Check-ins API

### GET /api/checkins
Get check-ins.

### POST /api/checkins
Create new check-in.

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error description"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token required or invalid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```
