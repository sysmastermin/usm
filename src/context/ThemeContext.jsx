import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // 초기 테마 설정 함수
    const getInitialTheme = () => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("theme");
            if (stored === "dark" || stored === "light") {
                return stored;
            }
            // 시스템 설정 확인
            if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "dark";
            }
        }
        return "light";
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = window.document.documentElement;
        
        // 기존 클래스 제거
        root.classList.remove("light", "dark");
        
        // 새 테마 클래스 추가
        root.classList.add(theme);
        
        // localStorage에 저장
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === "light" ? "dark" : "light";
            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
};
