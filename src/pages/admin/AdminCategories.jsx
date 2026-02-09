import { useState, useEffect } from 'react';
import {
  FolderTree,
  Pencil,
  Trash2,
  Check,
  X,
  Package,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

/**
 * 카테고리 관리 페이지
 * - 목록 + 소속 상품 수
 * - 인라인 편집 (이름 클릭 -> 입력 필드)
 * - 삭제 확인 (소속 상품 경고)
 * - 모바일 카드형 레이아웃
 */
export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      toast.error('카테고리를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditForm({
      name_ja: cat.name_ja || '',
      name_ko: cat.name_ko || '',
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await adminApi.put(
        `/categories/${editId}`,
        editForm
      );
      if (res.data.success) {
        toast.success('카테고리가 수정되었습니다');
        setEditId(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          '수정에 실패했습니다'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.delete(
        `/categories/${deleteTarget.id}`
      );
      toast.success('카테고리가 삭제되었습니다');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          '삭제에 실패했습니다'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          카테고리 관리
        </h1>
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        카테고리 관리
      </h1>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          카테고리가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-xl p-4',
                'border border-gray-200 dark:border-gray-700',
                'shadow-sm'
              )}
            >
              {/* 이미지 */}
              <div className="w-full aspect-video rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden mb-3">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderTree className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 편집 모드 */}
              {editId === cat.id ? (
                <div className="space-y-2">
                  <input
                    value={editForm.name_ja}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        name_ja: e.target.value,
                      }))
                    }
                    placeholder="일본어 이름"
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'bg-white dark:bg-gray-700',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:outline-none focus:ring-2',
                      'focus:ring-gray-900/20 dark:focus:ring-white/20',
                      'min-h-[40px]'
                    )}
                  />
                  <input
                    value={editForm.name_ko}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        name_ko: e.target.value,
                      }))
                    }
                    placeholder="한국어 이름"
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'bg-white dark:bg-gray-700',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:outline-none focus:ring-2',
                      'focus:ring-gray-900/20 dark:focus:ring-white/20',
                      'min-h-[40px]'
                    )}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 min-h-[40px]"
                    >
                      <Check className="w-4 h-4" />
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 min-h-[40px]"
                    >
                      <X className="w-4 h-4" />
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 이름 */}
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {cat.name_ko || cat.name_ja}
                  </h3>
                  {cat.name_ko && cat.name_ja && (
                    <p className="text-xs text-gray-400 truncate">
                      {cat.name_ja}
                    </p>
                  )}

                  {/* 상품 수 */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>상품 {cat.product_count}개</span>
                  </div>

                  {/* 액션 */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => startEdit(cat)}
                      className={cn(
                        'flex-1 flex items-center',
                        'justify-center gap-1 py-2',
                        'text-sm font-medium rounded-lg',
                        'bg-gray-100 dark:bg-gray-700',
                        'text-gray-700 dark:text-gray-300',
                        'hover:bg-gray-200',
                        'dark:hover:bg-gray-600',
                        'min-h-[40px]'
                      )}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      편집
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget(cat)
                      }
                      title={
                        cat.product_count > 0
                          ? `${cat.product_count}개 상품 포함 - 삭제 불가`
                          : '카테고리 삭제'
                      }
                      className={cn(
                        'flex items-center justify-center',
                        'p-2 rounded-lg min-w-[40px]',
                        'min-h-[40px]',
                        cat.product_count > 0
                          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-amber-400'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="카테고리 삭제"
        message={
          deleteTarget?.product_count > 0
            ? `"${deleteTarget?.name_ko || deleteTarget?.name_ja}" 카테고리에 ${deleteTarget?.product_count}개의 상품이 있습니다. 먼저 상품을 이동하거나 삭제해주세요.`
            : `"${deleteTarget?.name_ko || deleteTarget?.name_ja}" 카테고리를 삭제하시겠습니까?`
        }
      />
    </div>
  );
}
