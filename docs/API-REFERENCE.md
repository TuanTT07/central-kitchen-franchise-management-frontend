# Central Kitchen Franchise Management API

**Nguồn:** Backend nhóm (Swagger)  
**Base URL:** `https://cenframs.up.railway.app`  
**Swagger UI:** https://cenframs.up.railway.app/swagger-ui/index.html  
**OpenAPI spec (JSON):** https://cenframs.up.railway.app/v3/api-docs  

## Auth
- **Login:** `POST /auth/login` — body: `{ username, password }`
- **Refresh:** `POST /auth/refresh` — body: `{ refreshToken }`
- **Logout:** `POST /auth/logout` (cần Bearer token)
- **Header:** `Authorization: Bearer <access_token>`

## Các nhóm API chính
- **Auth:** `/auth/*`
- **Admin – Users:** `GET/POST /admin/users`, `PATCH/DELETE /admin/users/{id}`
- **Admin – Stores:** `GET/POST /admin/stores`, `GET/PATCH/DELETE /admin/stores/{id}`
- **Categories:** `GET/POST /api/v1/categories`, `GET/PATCH/DELETE /api/v1/categories/{id}`
- **Products:** `GET/POST /api/v1/products`, `GET/PATCH/DELETE /api/v1/products/{id}`
- **Units:** `GET/POST /api/v1/units`, `GET/PATCH/DELETE /api/v1/units/{id}`
- **Orders (Store):** `GET/POST /orders`, `GET /orders/{id}`, `POST /orders/{id}/approve`, `POST /orders/{id}/cancel`, `POST /orders/consolidate/*`
- **Manufacturing:** `GET/POST /api/v1/manufacturing-orders`, `PATCH /api/v1/manufacturing-orders/{id}/status`
- **Product batches:** `GET /api/v1/product-batches`
- **Inventory receipts:** `GET/POST /api/v1/inventory-receipts`, `GET /api/v1/inventory-receipts/{id}`
- **Export notes:** `GET /export-notes`, `GET /export-notes/{id}`, `POST /export-notes/createAutoNote`, `PUT /export-notes/{id}/ship`, …
- **Deliveries:** `GET/POST /deliveries`, `GET/PATCH /deliveries/{id}`, …
- **Inventory reports:** `GET /inventory-reports/stock-summary`, `near-expiry`, `top-importing-stores`, `top-consumed`
- **Inventory transactions:** `GET /inventory-transactions`, `GET /inventory-transactions/getHistoryByCode/{code}`

Response chuẩn: `{ success, data, message?, error? }`. Phân trang: `page`, `size`, `totalElements`, `totalPages`.
