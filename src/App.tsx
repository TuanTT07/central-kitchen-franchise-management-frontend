import LoginPage from './pages/auth/LoginPage.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import {
  AdminDashboard,
  BranchManagementPage,
  RolePermissionPage,
  SystemConfigPage,
  UserManagementPage,
} from './pages/admin/index.ts';
import { ManagerDashboard } from './pages/manager/index.ts';
import FranchiseStoreDashboard from './pages/franchise-store/FranchiseStoreDashboard.tsx';
import SupplyDashboard from './pages/supply/SupplyDashboard.tsx';
import CentralKitchenDashboard from './pages/central-kitchen/CentralKitchenDashboard.tsx';
import { AdminRoute, RoleRoute, ProtectedRoute } from './routes/index.ts';
import AdminShell from '@/components/layout/AdminShell';
import { AuthProvider } from '@/contexts/AuthContext';
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
              <Route element={<AdminRoute />}>
                <Route element={<AdminShell />}>
                  <Route path="/admin/stores" element={<BranchManagementPage />}></Route>
                  <Route path="/admin/users" element={<UserManagementPage />}></Route>
                  <Route path="/admin/roles" element={<RolePermissionPage />}></Route>
                  <Route path="/admin/configs" element={<SystemConfigPage />}></Route>
                </Route>
              </Route>

              {/* Routing riêng của manager */}
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
