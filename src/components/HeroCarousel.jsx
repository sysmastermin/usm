import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1600&auto=format&fit=crop",
        title: "USM 모듈러 가구",
        subtitle: "시대를 초월한 스위스 디자인. 당신만의 공간을 완성하세요.",
        link: "#products"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop",
        title: "홈 오피스 컬렉션",
        subtitle: "창의적인 영감을 주는 업무 공간을 위한 완벽한 솔루션.",
        link: "#"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1600&auto=format&fit=crop",
        title: "다채로운 리빙룸",
        subtitle: "14가지 시그니처 컬러로 거실에 생기를 불어넣으세요.",
        link: "#"
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=1600&auto=format&fit=crop",
        title: "스마트한 수납 솔루션",
        subtitle: "기능성과 아름다움을 겸비한 무한한 확장성.",
        link: "#"
    }
];

export default function HeroCarousel() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative h-[70vh] min-h-[500px] mb-16 overflow-hidden bg-gray-100 dark:bg-gray-900 group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <img
                        src={slides[current].image}
                        alt={slides[current].title}
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white text-center md:text-left z-10">
                <motion.div
                    key={`content-${current}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-4 drop-shadow-md">
                        {slides[current].title}
                    </h1>
                    <p className="text-lg md:text-xl opacity-90 max-w-xl mb-6 drop-shadow-sm md:mx-0 mx-auto">
                        {slides[current].subtitle}
                    </p>
                    <Link
                        to={slides[current].link}
                        className="inline-block bg-white text-black px-8 py-3 font-medium hover:bg-gray-100 transition-colors"
                    >
                        자세히 보기
                    </Link>
                </motion.div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-8 right-8 flex gap-3 z-10">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`h-1 rounded-full transition-all duration-300 ${current === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
