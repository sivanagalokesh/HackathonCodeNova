import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';

import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';

import OperationsLayout from './pages/operations/OperationsLayout';
import Dashboard from './pages/operations/Dashboard';
import Workers from './pages/operations/Workers';
import EventStream from './pages/operations/EventStream';
import Dlq from './pages/operations/Dlq';
import ConcurrentTest from './pages/operations/ConcurrentTest';
import OpsOrders from './pages/operations/OpsOrders';
import Analytics from './pages/operations/Analytics';

function ProtectedOperations() {
  const { user } = useAuth();
  if (!user || user.role !== 'OPERATOR') return <Login />;
  return <OperationsLayout />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function App() {
  const loc = useLocation();
  const isOps = loc.pathname.startsWith('/operations');

  return (
    <AuthProvider>
      {isOps ? <ToastProvider><Routes>
        <Route path="/operations" element={<ProtectedOperations />}>
          <Route index element={<Dashboard />} />
          <Route path="workers" element={<Workers />} />
          <Route path="events" element={<EventStream />} />
          <Route path="orders" element={<OpsOrders />} />
          <Route path="analysis" element={<Analytics />} />
          <Route path="dlq" element={<Dlq />} />
          <Route path="test" element={<ConcurrentTest />} />
        </Route>
      </Routes></ToastProvider> :
      <CartProvider>
        <ToastProvider>
          <Routes><Route path="/login" element={<Login />} /></Routes>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/category/:id" element={<Products />} />
              <Route path="/deals" element={<Products deals />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
              <Route path="/orders/:id" element={<RequireAuth><Orders /></RequireAuth>} />
            </Routes>
          </main>
          <Footer />
          <Chatbot />
        </ToastProvider>
      </CartProvider>
      }
    </AuthProvider>
  );
}
