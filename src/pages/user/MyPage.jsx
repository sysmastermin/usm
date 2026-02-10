import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Heart, ChevronRight, Loader2 } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import userApi from '../../lib/userApi';

export default function MyPage() {
  const { user, logout } = useUserAuth();
  const [profile, setProfile] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [wishlistPreview, setWishlistPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes, wishRes] =
        await Promise.all([
          userApi.get('/auth/profile'),
          userApi.get('/orders?limit=3'),
          userApi.get('/wishlist'),
        ]);
      const p = profileRes.data.data;
      setProfile(p);
      setForm({
        name: p.name || '',
        phone: p.phone || '',
        zipcode: p.zipcode || '',
        address: p.address || '',
        addressDetail: p.address_detail || '',
        birthDate: p.birth_date
          ? p.birth_date.slice(0, 10)
          : '',
      });
      setRecentOrders(
        ordersRes.data.data?.orders || []
      );
      setWishlistPreview(
        (wishRes.data.data || []).slice(0, 4)
      );
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMsg('');
    try {
      await userApi.put('/auth/profile', form);
      setMsg('프로필이 수정되었습니다');
      setEditing(false);
      loadData();
    } catch (err) {
      setMsg(
        err.response?.data?.message || '수정 실패'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg('');
    try {
      await userApi.put('/auth/password', pwForm);
      setPwMsg('비밀번호가 변경되었습니다');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwMsg(
        err.response?.data?.message || '변경 실패'
      );
    } finally {
      setPwSaving(false);
    }
  };

  const STATUS_MAP = {
    pending: { label: '주문접수', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: '결제완료', color: 'bg-blue-100 text-blue-800' },
    shipping: { label: '배송중', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: '배송완료', color: 'bg-green-100 text-green-800' },
    cancelled: { label: '취소', color: 'bg-gray-100 text-gray-600' },
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        마이페이지
      </h1>

      {/* 프로필 섹션 */}
      <section className="border border-gray-200 dark:border-gray-800 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <User className="w-5 h-5" />
            내 정보
          </h2>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-sm text-gray-500 hover:text-black dark:hover:text-white"
          >
            {editing ? '취소' : '수정'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            {[
              ['이름', 'name', 'text'],
              ['연락처', 'phone', 'tel'],
              ['우편번호', 'zipcode', 'text'],
              ['주소', 'address', 'text'],
              ['상세주소', 'addressDetail', 'text'],
              ['생년월일', 'birthDate', 'date'],
            ].map(([label, key, type]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                  {label}
                </span>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      [key]: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                />
              </div>
            ))}
            {msg && (
              <p className="text-sm text-green-600">{msg}</p>
            )}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <Info label="이메일" value={profile?.email} />
            <Info label="이름" value={profile?.name} />
            <Info label="연락처" value={profile?.phone} />
            <Info
              label="주소"
              value={
                profile?.address
                  ? `${profile.zipcode || ''} ${profile.address} ${profile.address_detail || ''}`
                  : '-'
              }
            />
          </div>
        )}
      </section>

      {/* 최근 주문 */}
      <section className="border border-gray-200 dark:border-gray-800 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Package className="w-5 h-5" />
            최근 주문
          </h2>
          <Link
            to="/orders"
            className="text-sm text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-1"
          >
            전체보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            주문 내역이 없습니다
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.map((order) => {
              const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-900 -mx-2 px-2 rounded"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Number(order.total_amount).toLocaleString()}원
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 위시리스트 미리보기 */}
      <section className="border border-gray-200 dark:border-gray-800 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Heart className="w-5 h-5" />
            위시리스트
          </h2>
          <Link
            to="/wishlist"
            className="text-sm text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-1"
          >
            전체보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {wishlistPreview.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            위시리스트가 비어있습니다
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {wishlistPreview.map((item) => (
              <Link
                key={item.product_id}
                to={`/product/${item.product_id}`}
                className="group"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden mb-2">
                  <img
                    src={item.image_url || '/placeholder.png'}
                    alt={item.name_ko || item.name_ja}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {item.name_ko || item.name_ja}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 비밀번호 변경 */}
      <section className="border border-gray-200 dark:border-gray-800 rounded-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          비밀번호 변경
        </h2>
        <form
          onSubmit={handleChangePassword}
          className="space-y-3 max-w-sm"
        >
          <input
            type="password"
            placeholder="현재 비밀번호"
            value={pwForm.currentPassword}
            onChange={(e) =>
              setPwForm((p) => ({
                ...p,
                currentPassword: e.target.value,
              }))
            }
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
          <input
            type="password"
            placeholder="새 비밀번호 (8자 이상, 영문+숫자)"
            value={pwForm.newPassword}
            onChange={(e) =>
              setPwForm((p) => ({
                ...p,
                newPassword: e.target.value,
              }))
            }
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
          {pwMsg && (
            <p className="text-sm text-green-600">{pwMsg}</p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
          >
            {pwSaving ? '변경 중...' : '변경'}
          </button>
        </form>
      </section>

      {/* 로그아웃 */}
      <div className="text-center">
        <button
          type="button"
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <span className="text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <p className="text-gray-900 dark:text-white">
        {value || '-'}
      </p>
    </div>
  );
}
