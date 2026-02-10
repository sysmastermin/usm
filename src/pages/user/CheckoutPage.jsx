import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import userApi from '../../lib/userApi';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { updateCartCount } = useUserAuth();
  const [cartItems, setCartItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [shipping, setShipping] = useState({
    recipientName: '',
    recipientPhone: '',
    zipcode: '',
    address: '',
    addressDetail: '',
  });
  const [memo, setMemo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cartRes, profileRes] = await Promise.all([
        userApi.get('/cart'),
        userApi.get('/auth/profile'),
      ]);
      const items = cartRes.data.data || [];
      if (items.length === 0) {
        navigate('/cart', { replace: true });
        return;
      }
      setCartItems(items);
      const p = profileRes.data.data;
      setProfile(p);
      // 프로필 주소로 자동 채움
      setShipping({
        recipientName: p.name || '',
        recipientPhone: p.phone || '',
        zipcode: p.zipcode || '',
        address: p.address || '',
        addressDetail: p.address_detail || '',
      });
    } catch {
      // 에러
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cartItems.reduce(
    (sum, item) =>
      sum + (item.price || 0) * item.quantity,
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !shipping.recipientName ||
      !shipping.recipientPhone ||
      !shipping.zipcode ||
      !shipping.address
    ) {
      setError(
        '수령인 이름, 연락처, 우편번호, 주소는 필수입니다'
      );
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await userApi.post('/orders', {
        shipping,
        memo,
      });
      updateCartCount();
      // 주문 완료 후 주문 상세로 이동
      navigate(`/orders/${res.data.data.id}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message || '주문 실패'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        주문/결제
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* 배송지 정보 (3/5) */}
          <div className="lg:col-span-3 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              배송지 정보
            </h2>

            <ShipField
              label="수령인"
              required
              value={shipping.recipientName}
              onChange={(v) =>
                setShipping((p) => ({
                  ...p,
                  recipientName: v,
                }))
              }
            />
            <ShipField
              label="연락처"
              required
              type="tel"
              value={shipping.recipientPhone}
              onChange={(v) =>
                setShipping((p) => ({
                  ...p,
                  recipientPhone: v,
                }))
              }
              placeholder="010-1234-5678"
            />
            <div className="grid grid-cols-3 gap-3">
              <ShipField
                label="우편번호"
                required
                value={shipping.zipcode}
                onChange={(v) =>
                  setShipping((p) => ({
                    ...p,
                    zipcode: v,
                  }))
                }
                placeholder="12345"
              />
              <div className="col-span-2">
                <ShipField
                  label="주소"
                  required
                  value={shipping.address}
                  onChange={(v) =>
                    setShipping((p) => ({
                      ...p,
                      address: v,
                    }))
                  }
                />
              </div>
            </div>
            <ShipField
              label="상세주소"
              value={shipping.addressDetail}
              onChange={(v) =>
                setShipping((p) => ({
                  ...p,
                  addressDetail: v,
                }))
              }
              placeholder="아파트 동/호수"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                배송 메모
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="배송 시 요청사항"
              />
            </div>
          </div>

          {/* 주문 요약 (2/5) */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 border border-gray-200 dark:border-gray-800 rounded-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                주문 요약
              </h2>

              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden shrink-0">
                      <img
                        src={
                          item.image_url ||
                          '/placeholder.png'
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {item.name_ko || item.name_ja}
                      </p>
                      <p className="text-xs text-gray-400">
                        x{item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white shrink-0">
                      {(
                        (item.price || 0) * item.quantity
                      ).toLocaleString()}
                      원
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span>상품 합계</span>
                  <span>
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>배송비</span>
                  <span>
                    {totalAmount >= 500000
                      ? '무료'
                      : '30,000원'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>총 결제금액</span>
                  <span>
                    {(
                      totalAmount +
                      (totalAmount >= 500000
                        ? 0
                        : 30000)
                    ).toLocaleString()}
                    원
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    주문 처리 중...
                  </>
                ) : (
                  '결제하기'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ShipField({
  label,
  required,
  type = 'text',
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && (
          <span className="text-red-500 ml-0.5">*</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
      />
    </div>
  );
}
