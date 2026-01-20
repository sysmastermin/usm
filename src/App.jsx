import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import ScenePage from "./pages/ScenePage";
import SceneDetailPage from "./pages/SceneDetailPage";
import CategoryPage from "./pages/CategoryPage";
import ColorPage from "./pages/ColorPage";
import ConfiguratorPage from "./pages/ConfiguratorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProductList />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="scene" element={<ScenePage />} />
        <Route path="scene/:sceneId/:imageId" element={<SceneDetailPage />} />
        <Route path="category/:categoryName" element={<CategoryPage />} />
        <Route path="color/:colorName" element={<ColorPage />} />
        <Route path="configurator" element={<ConfiguratorPage />} />
        <Route path="*" element={<div className="p-12 text-center text-gray-500">404 Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
