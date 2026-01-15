import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-gray-900 dark:bg-black text-white py-16 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">USM</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            1885년 스위스에서 설립된 USM은 시대를 초월한 모듈러 가구 시스템을 제공합니다.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">쇼핑</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/" className="hover:text-white transition-colors">전체 상품</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">수납장</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">테이블</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">액세서리</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">고객 서비스</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="#" className="hover:text-white transition-colors">배송 안내</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">반품 및 교환</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">자주 묻는 질문</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">문의하기</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">뉴스레터</h4>
                        <p className="text-sm text-gray-400 mb-4">
                            새로운 소식과 프로모션 정보를 받아보세요.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-sm focus:outline-none focus:border-white text-sm text-white placeholder-gray-500"
                            />
                            <button className="px-4 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors">
                                구독
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} USM Clone. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-gray-500">
                        <Link to="#" className="hover:text-white transition-colors">개인정보처리방침</Link>
                        <Link to="#" className="hover:text-white transition-colors">이용약관</Link>
                        <Link to="#" className="hover:text-white transition-colors">사업자정보</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
