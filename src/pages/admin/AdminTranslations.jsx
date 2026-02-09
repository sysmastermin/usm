import { useState, useEffect, useCallback } from 'react';
import {
  Languages,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import Pagination from '../../components/admin/Pagination';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

/**
 * 번역 관리 페이지
 * - 미번역 항목 목록 (상품/카테고리 탭)
 * - 인라인 수동 번역 편집
 * - 체크박스 선택 -> 일괄 번역
 */
export default function AdminTranslations() {
  const toast = useToast();
  const [type, setType] = useState('product');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 1, limit: 20, total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [translating, setTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] =
    useState({ done: 0, total: 0 });
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      setSelected(new Set());
      try {
        const res = await adminApi.get('/untranslated', {
          params: { type, page, limit: 20 },
        });
        if (res.data.success) {
          setItems(res.data.data);
          setMeta(res.data.meta);
        }
      } catch {
        toast.error('미번역 항목을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  // 체크박스 토글
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  // 일괄 번역
  const handleBatchTranslate = async () => {
    if (selected.size === 0) {
      toast.error('번역할 항목을 선택해주세요');
      return;
    }

    const total = selected.size;
    setTranslating(true);
    setTranslateProgress({ done: 0, total });

    try {
      const res = await adminApi.post('/translate', {
        ids: Array.from(selected),
        type,
      });

      if (res.data.success) {
        const { translated, failed } =
          res.data.data || {};
        setTranslateProgress({
          done: (translated || 0) + (failed || 0),
          total,
        });
        toast.success(res.data.message);
        fetchItems(meta.page);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          '번역에 실패했습니다'
      );
    } finally {
      setTranslating(false);
      // 2초 후 프로그레스 바 리셋
      setTimeout(() => {
        setTranslateProgress({ done: 0, total: 0 });
      }, 2000);
    }
  };

  // 인라인 편집 저장
  const saveInlineEdit = async () => {
    if (!editId || !editValue.trim()) return;
    setEditSaving(true);
    try {
      if (type === 'category') {
        await adminApi.put(`/categories/${editId}`, {
          name_ko: editValue,
        });
      } else {
        await adminApi.put(`/products/${editId}`, {
          name_ko: editValue,
        });
      }
      toast.success('저장되었습니다');
      setEditId(null);
      setEditValue('');
      fetchItems(meta.page);
    } catch (err) {
      toast.error('저장에 실패했습니다');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          번역 관리
        </h1>
        <button
          onClick={handleBatchTranslate}
          disabled={
            translating || selected.size === 0
          }
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg',
            'text-sm font-medium transition-colors',
            'min-h-[44px]',
            selected.size > 0 && !translating
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          )}
        >
          {translating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Languages className="w-4 h-4" />
          )}
          {translating
            ? '번역 중...'
            : `일괄 번역 (${selected.size}개)`}
        </button>
      </div>

      {/* 타입 탭 */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'product', label: '상품' },
          { id: 'category', label: '카테고리' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium',
              'border-b-2 transition-colors min-h-[44px]',
              type === t.id
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 번역 진행바 (실제 진행률 기반) */}
      {(translating || translateProgress.done > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {translating ? '번역 진행 중...' : '완료'}
            </span>
            <span>
              {translateProgress.done}
              {' / '}
              {translateProgress.total}
            </span>
          </div>
          <div
            className={cn(
              'w-full rounded-full h-2',
              'bg-gray-200 dark:bg-gray-700'
            )}
          >
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                'duration-500 ease-out',
                translating
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-green-500'
              )}
              style={{
                width: translateProgress.total > 0
                  ? `${Math.round(
                      (translateProgress.done /
                        translateProgress.total) *
                        100
                    )}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* 항목 목록 */}
      {loading ? (
        <LoadingSkeleton variant="card" count={5} />
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Languages className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            미번역 항목이 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 전체 선택 */}
          <div className="flex items-center gap-3 px-4 py-2">
            <input
              type="checkbox"
              checked={
                items.length > 0 &&
                selected.size === items.length
              }
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 min-w-[20px] min-h-[20px]"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              전체 선택 ({meta.total}개 미번역)
            </span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg p-4',
                'border border-gray-200 dark:border-gray-700',
                selected.has(item.id) &&
                  'ring-2 ring-purple-500/30'
              )}
            >
              <div className="flex items-start gap-3">
                {/* 체크박스 */}
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 mt-1 min-w-[20px] min-h-[20px]"
                />

                <div className="flex-1 min-w-0">
                  {/* 원문 (일본어) */}
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {item.name_ja}
                  </p>
                  {type === 'product' &&
                    item.category_name_ja && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.category_name_ko ||
                          item.category_name_ja}
                      </p>
                    )}

                  {/* 인라인 편집 */}
                  {editId === item.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={editValue}
                        onChange={(e) =>
                          setEditValue(e.target.value)
                        }
                        placeholder="한국어 번역 입력..."
                        autoFocus
                        className={cn(
                          'flex-1 px-3 py-2 text-sm rounded-lg',
                          'bg-white dark:bg-gray-700',
                          'border border-gray-300 dark:border-gray-600',
                          'text-gray-900 dark:text-white',
                          'focus:outline-none focus:ring-2',
                          'focus:ring-purple-500/20',
                          'min-h-[40px]'
                        )}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            saveInlineEdit();
                          if (e.key === 'Escape') {
                            setEditId(null);
                            setEditValue('');
                          }
                        }}
                      />
                      <button
                        onClick={saveInlineEdit}
                        disabled={editSaving}
                        className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                      >
                        {editSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditId(null);
                          setEditValue('');
                        }}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 min-w-[40px] min-h-[40px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditId(item.id);
                        setEditValue(
                          item.name_ko || ''
                        );
                      }}
                      className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline min-h-[32px]"
                    >
                      + 수동 번역 입력
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      <Pagination
        page={meta.page}
        limit={meta.limit}
        total={meta.total}
        onPageChange={(p) => fetchItems(p)}
      />
    </div>
  );
}
