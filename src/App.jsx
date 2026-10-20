import { Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="san-pham" element={<Products />} />
        <Route path="san-pham/:slug" element={<ProductDetail />} />
        <Route path="gio-hang" element={<Cart />} />
        <Route path="lien-he" element={<Contact />} />
        <Route path="dang-nhap" element={<Login />} />
        <Route path="dang-ky" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="tai-khoan" element={<Account />} />
          <Route path="tai-khoan/don-hang/:id" element={<OrderDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
