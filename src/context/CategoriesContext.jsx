import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CategoriesContext = createContext({
  categories: [],
  isLoading: true,
  error: "",
});

const API_BASE_URL = "/api";

/**
 * 카테고리 데이터를 한 번만 가져와 앱 전체에서 공유하는 Provider
 * Header와 ProductList 등에서 중복 fetch를 방지
 */
export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/categories`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch categories: ${response.status}`
          );
        }

        const data = await response.json();
        const list = Array.isArray(data?.data)
          ? data.data
          : [];

        if (isMounted) setCategories(list);
      } catch {
        if (isMounted) {
          setError(
            "카테고리 목록을 불러오는 중 오류가 발생했습니다."
          );
          setCategories([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CategoriesContext.Provider
      value={{ categories, isLoading, error }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

/**
 * CategoriesContext 사용을 위한 커스텀 훅
 */
export function useCategoriesContext() {
  return useContext(CategoriesContext);
}
