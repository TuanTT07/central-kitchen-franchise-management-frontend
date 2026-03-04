import LoginPage from './pages/auth/LoginPage.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import {
  AdminDashboard,
  BranchManagementPage,
  RolePermissionPage,
  SystemConfigPage,
  UserManagementPage,
} from './pages/admin/index.ts';
import {
  InventoryOverviewPage,
  ManagerDashboard,
  ProductManagementPage,
  ReportsPage,
  CategoryManager,
} from './pages/manager/index.ts';
import FranchiseStoreDashboard from './pages/franchise-store/FranchiseStoreDashboard.tsx';
import SupplyDashboard from './pages/supply/SupplyDashboard.tsx';
import CentralKitchenDashboard from './pages/central-kitchen/CentralKitchenDashboard.tsx';
import { RoleRoute, ProtectedRoute } from './routes/index.ts';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectRoleRoute from './routes/ProtectRoleRoute.tsx';
import { ADMIN_SIDEBAR_ITEMS } from './components/layout/index.ts';
import RoleShell from './components/layout/RoleShell.tsx';
import { MANAGER_SIDEBAR_ITEMS } from './components/layout/sidebarConfig.ts';
function App() {
  return (
    <>
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
                    franchise={<FranchiseStoreDashboard />}
                    manager={<ManagerDashboard />}
                    supplier={<SupplyDashboard />}
                    centralKitchen={<CentralKitchenDashboard />}
                  />
                }
              ></Route>

              {/* Routing riêng của admin */}
              <Route element={<ProtectRoleRoute roleProtect="ADMIN" />}>
                <Route element={<RoleShell sidebarItems={ADMIN_SIDEBAR_ITEMS} roleLabel="ADMIN" />}>
                  <Route path="/admin/stores" element={<BranchManagementPage />}></Route>
                  <Route path="/admin/users" element={<UserManagementPage />}></Route>
                  <Route path="/admin/roles" element={<RolePermissionPage />}></Route>
                  <Route path="/admin/configs" element={<SystemConfigPage />}></Route>
                </Route>
              </Route>

              {/* Routing riêng của manager */}
              <Route element={<ProtectRoleRoute roleProtect="MANAGER" />}>
                <Route element={<RoleShell sidebarItems={MANAGER_SIDEBAR_ITEMS} roleLabel="MANAGER" />}>
                  <Route path="/manager/inventory-overview" element={<InventoryOverviewPage />}></Route>
                  <Route path="/manager/products" element={<ProductManagementPage />}></Route>
                  <Route path="/manager/categories" element={<CategoryManager />}></Route>
                  <Route path="/manager/reports" element={<ReportsPage />}></Route>
                </Route>
              </Route>

              {/* Routing riêng của central kitchen */}
              {/* Routing riêng của franchise store */}
              {/* Routing riêng của supplier */}
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
