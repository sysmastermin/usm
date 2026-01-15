import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProductList />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="*" element={<div className="p-12 text-center text-gray-500">404 Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
