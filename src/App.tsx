import LoginPage from './pages/auth/LoginPage.tsx';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router';
import {
  AdminDashboard,
  BranchManagementPage,
  UserManagementPage,
  SystemConfigPage,
} from './pages/admin/index.ts';
import {
  InventoryOverviewPage,
  ManagerDashboard,
  ProductManagementPage,
  ReportsPage,
  CategoryManager,
  ManagerReceiptsPage,
  InventoryMovementsPage,
} from './pages/manager/index.ts';
import {
  DeliverySchedulePage,
  DistributionPlanPage,
  IssueHandlingPage,
  SummaryOrdersPage,
  InventoryPage,
} from './pages/supply/index.ts';

import { ManufacturingOrders, ProductBatches, Receipts } from './pages/central-kitchen/index.ts';

import {
  CreateOrderPage,
  OrderTrackingPage,
  StoreProfile,
} from './pages/franchise-store/index.ts';
import { RoleRoute, ProtectedRoute } from './routes/index.ts';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import FranchiseCartOverlay from '@/components/cart/FranchiseCartOverlay';
import ProtectRoleRoute from './routes/ProtectRoleRoute.tsx';
import { ADMIN_SIDEBAR_ITEMS } from './components/layout/index.ts';
import RoleShell from './components/layout/RoleShell.tsx';
import {
  CENTRAL_KITCHEN_SIDEBAR_ITEMS,
  FRANCHISEE_SIDEBAR_ITEMS,
  MANAGER_SIDEBAR_ITEMS,
  SUPPLY_COORDINATOR_SIDEBAR_ITEMS,
} from './components/layout/sidebarConfig.ts';
import { Role } from './Types/index.ts';
import SupplyDashboard from './pages/supply/SupplyDashboard.tsx';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Login cho các role */}
            <Route path="/login" element={<LoginPage />}></Route>

            <Route element={<ProtectedRoute />}>
              {/* Kiểm tra role và trả về các dashboard tương ứng với role */}
              <Route
                path="/"
                element={
                  <RoleRoute
                    admin={<AdminDashboard />}
                    franchise={<Navigate to="/franchise-store/create-order" replace />}
                    manager={<ManagerDashboard />}
                    supplier={<SupplyDashboard />}
                    centralKitchen={<Navigate to="/central-kitchen/orders" replace />}
                  />
                }
              ></Route>

              {/* Routing riêng của admin */}
              <Route element={<ProtectRoleRoute roleProtect={Role.ADMIN} />}>
                <Route element={<RoleShell sidebarItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN" />}>
                  <Route path="/admin/stores" element={<BranchManagementPage />}></Route>
                  <Route path="/admin/users" element={<UserManagementPage />}></Route>
                  <Route path="/admin/settings" element={<SystemConfigPage />}></Route>
                </Route>
              </Route>

              {/* Routing riêng của manager */}
              <Route element={<ProtectRoleRoute roleProtect={Role.MANAGER} />}>
                <Route element={<RoleShell sidebarItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER" />}>
                  <Route path="/manager/inventory-overview" element={<InventoryOverviewPage />}></Route>
                  <Route path="/manager/products" element={<ProductManagementPage />}></Route>
                  <Route path="/manager/receipts" element={<ManagerReceiptsPage />}></Route>
                  <Route path="/manager/categories" element={<CategoryManager />}></Route>
                  <Route path="/manager/inventory-movements" element={<InventoryMovementsPage />}></Route>
                  <Route path="/manager/reports" element={<ReportsPage />}></Route>
                </Route>
              </Route>

              {/* Routing riêng của central kitchen */}
              <Route element={<ProtectRoleRoute roleProtect={Role.CENTRAL_KITCHEN_STAFF} />}>
                <Route element={<RoleShell sidebarItems={CENTRAL_KITCHEN_SIDEBAR_ITEMS} roleLabel="CENTRAL_KITCHEN" />}>
                  <Route path="/central-kitchen/orders" element={<ManufacturingOrders />}></Route>
                  <Route path="/central-kitchen/receipts" element={<Receipts />}></Route>
                  <Route path="/central-kitchen/product-batches" element={<ProductBatches />}></Route>
                </Route>
              </Route>
              {/* Routing riêng của franchise store */}
              <Route element={<ProtectRoleRoute roleProtect={Role.FRANCHISE_STORE_STAFF} />}>
                <Route
                  element={
                    <CartProvider>
                      <FranchiseCartOverlay>
                        <RoleShell sidebarItems={FRANCHISEE_SIDEBAR_ITEMS} roleLabel={Role.FRANCHISE_STORE_STAFF} />
                      </FranchiseCartOverlay>
                    </CartProvider>
                  }
                >
                  <Route path="/franchise-store/create-order" element={<CreateOrderPage />}></Route>
                  <Route path="/franchise-store/order-tracking" element={<OrderTrackingPage />}></Route>
                  <Route path="/franchise-store/store-profile" element={<StoreProfile />}></Route>
                </Route>
              </Route>
              {/* Routing riêng của supplier */}
              <Route element={<ProtectRoleRoute roleProtect={Role.SUPPLY_COORDINATOR} />}>
                <Route
                  element={
                    <RoleShell sidebarItems={SUPPLY_COORDINATOR_SIDEBAR_ITEMS} roleLabel={Role.SUPPLY_COORDINATOR} />
                  }
                >
                  <Route path="/supply-coordinator/delivery-schedule" element={<DeliverySchedulePage />}></Route>
                  <Route path="/supply-coordinator/distribution-plan" element={<DistributionPlanPage />}></Route>
                  <Route path="/supply-coordinator/issues" element={<IssueHandlingPage />}></Route>
                  <Route path="/supply-coordinator/summary-orders" element={<SummaryOrdersPage />}></Route>
                  <Route path="/supply-coordinator/inventory" element={<InventoryPage />}></Route>
                </Route>
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
