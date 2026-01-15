import { useState, useEffect, useRef } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import products from "../data/mockProducts.json";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchModal({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim() === "") {
            setSearchResults([]);
            return;
        }

        const searchTerm = query.toLowerCase();
        const results = products.filter((product) => {
            return (
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        });

        setSearchResults(results);
        setSelectedIndex(-1);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < searchResults.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                handleProductClick(searchResults[selectedIndex].id);
            } else if (e.key === "Enter" && searchResults.length === 1) {
                e.preventDefault();
                handleProductClick(searchResults[0].id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, searchResults, selectedIndex, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
        onClose();
        setQuery("");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-20 px-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col"
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                        <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="제품명, 카테고리, 설명으로 검색..."
                            className="flex-1 bg-transparent text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>

                    {/* Search Results */}
                    <div className="max-h-[60vh] overflow-y-auto flex-1">
                        {query.trim() === "" ? (
                            <div className="p-6 md:p-8 text-center text-gray-500 dark:text-gray-400">
                                <p className="text-sm md:text-base">검색어를 입력하세요</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-6 md:p-8 text-center text-gray-500 dark:text-gray-400">
                                <p className="text-sm md:text-base">검색 결과가 없습니다</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                                {searchResults.map((product, index) => (
                                    <li key={product.id}>
                                        <button
                                            onClick={() => handleProductClick(product.id)}
                                            className={`w-full text-left p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                                                index === selectedIndex
                                                    ? "bg-gray-100 dark:bg-gray-900"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-12 h-12 md:w-16 md:h-16 object-cover flex-shrink-0 rounded-sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm md:text-base font-medium text-gray-900 dark:text-white truncate">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {product.category}
                                                    </p>
                                                    <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                                        {product.price}원
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    {searchResults.length > 0 && (
                        <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 text-center flex-shrink-0">
                            <p>
                                {searchResults.length}개의 결과 • Enter로 선택, ESC로 닫기
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
