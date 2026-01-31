import LoginPage from './pages/auth/LoginPage.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import ProtectedRoute from './routes/ProtectedRoute.tsx';
import RoleRoute from './routes/RoleRoute.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.tsx';
import FranchiseStoreDashboard from './pages/franchise-store/FranchiseStoreDashboard.tsx';
import SupplyDashboard from './pages/supply/SupplyDashboard.tsx';
import CentralKitchenDashboard from './pages/central-kitchen/CentralKitchenDashboard.tsx';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />}></Route>

          <Route element={<ProtectedRoute />}>
            {/* Kiểm tra role và trả về trang tương ứng với role */}
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
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
