import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';

/** 비밀번호 강도 계산 (0~4) */
function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = [
  '',
  '약함',
  '보통',
  '강함',
  '매우 강함',
];
const STRENGTH_COLORS = [
  'bg-gray-200',
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-green-600',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    loading,
    error,
    register,
    clearError,
  } = useUserAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    zipcode: '',
    address: '',
    addressDetail: '',
    birthDate: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // 이미 로그인 상태면 홈으로
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    clearError();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 해당 필드 에러 초기화
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;

    if (!emailRegex.test(form.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }
    if (form.password.length < 8) {
      errors.password = '8자 이상 입력해주세요';
    } else if (
      !/[a-zA-Z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      errors.password = '영문과 숫자를 포함해주세요';
    }
    if (form.password !== form.passwordConfirm) {
      errors.passwordConfirm =
        '비밀번호가 일치하지 않습니다';
    }
    if (form.name.length < 2 || form.name.length > 50) {
      errors.name = '2~50자로 입력해주세요';
    }
    if (form.phone && !phoneRegex.test(form.phone)) {
      errors.phone =
        '올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)';
    }
    if (!agreed) {
      errors.agreed = '이용약관에 동의해주세요';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await register({
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone || undefined,
      zipcode: form.zipcode || undefined,
      address: form.address || undefined,
      addressDetail: form.addressDetail || undefined,
      birthDate: form.birthDate || undefined,
    });

    if (success) {
      navigate('/', { replace: true });
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          회원가입
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          USM 모듈러 가구 공식 스토어
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* 이메일 */}
        <Field
          label="이메일"
          required
          error={fieldErrors.email}
        >
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) =>
              updateField('email', e.target.value)
            }
            className={inputCls(fieldErrors.email)}
            placeholder="example@email.com"
          />
        </Field>

        {/* 비밀번호 */}
        <Field
          label="비밀번호"
          required
          error={fieldErrors.password}
          hint="영문, 숫자 포함 8자 이상"
        >
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) =>
                updateField('password', e.target.value)
              }
              className={inputCls(
                fieldErrors.password,
                'pr-12'
              )}
              placeholder="비밀번호 입력"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              tabIndex={-1}
            >
              {showPw ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* 비밀번호 강도 바 */}
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 rounded-full ${
                      pwStrength >= level
                        ? STRENGTH_COLORS[pwStrength]
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {STRENGTH_LABELS[pwStrength]}
              </p>
            </div>
          )}
        </Field>

        {/* 비밀번호 확인 */}
        <Field
          label="비밀번호 확인"
          required
          error={fieldErrors.passwordConfirm}
        >
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={(e) =>
                updateField(
                  'passwordConfirm',
                  e.target.value
                )
              }
              className={inputCls(
                fieldErrors.passwordConfirm,
                'pr-10'
              )}
              placeholder="비밀번호 재입력"
            />
            {form.passwordConfirm &&
              form.password === form.passwordConfirm && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
          </div>
        </Field>

        {/* 이름 */}
        <Field
          label="이름"
          required
          error={fieldErrors.name}
        >
          <input
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) =>
              updateField('name', e.target.value)
            }
            className={inputCls(fieldErrors.name)}
            placeholder="홍길동"
          />
        </Field>

        {/* 연락처 */}
        <Field
          label="연락처"
          error={fieldErrors.phone}
        >
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) =>
              updateField('phone', e.target.value)
            }
            className={inputCls(fieldErrors.phone)}
            placeholder="010-1234-5678"
          />
        </Field>

        {/* 주소 */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="우편번호" className="col-span-1">
            <input
              type="text"
              value={form.zipcode}
              onChange={(e) =>
                updateField('zipcode', e.target.value)
              }
              className={inputCls()}
              placeholder="12345"
              maxLength={5}
            />
          </Field>
          <Field label="주소" className="col-span-2">
            <input
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) =>
                updateField('address', e.target.value)
              }
              className={inputCls()}
              placeholder="서울시 강남구 역삼동"
            />
          </Field>
        </div>
        <Field label="상세주소">
          <input
            type="text"
            value={form.addressDetail}
            onChange={(e) =>
              updateField(
                'addressDetail',
                e.target.value
              )
            }
            className={inputCls()}
            placeholder="아파트 동/호수"
          />
        </Field>

        {/* 생년월일 */}
        <Field label="생년월일">
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) =>
              updateField('birthDate', e.target.value)
            }
            className={inputCls()}
          />
        </Field>

        {/* 이용약관 */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-black dark:accent-white"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-black dark:text-white">
              이용약관
            </span>{' '}
            및{' '}
            <span className="font-medium text-black dark:text-white">
              개인정보 처리방침
            </span>
            에 동의합니다
          </span>
        </label>
        {fieldErrors.agreed && (
          <p className="text-xs text-red-600 dark:text-red-400 -mt-3">
            {fieldErrors.agreed}
          </p>
        )}

        {/* 서버 에러 */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* 가입 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              가입 처리 중...
            </>
          ) : (
            '회원가입'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        이미 회원이신가요?{' '}
        <Link
          to="/login"
          className="text-black dark:text-white font-medium hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}

/* ---- 공통 컴포넌트 ---- */

function Field({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(error, extra = '') {
  const base =
    'w-full px-4 py-3 border rounded-sm bg-white ' +
    'dark:bg-gray-900 text-gray-900 dark:text-white ' +
    'focus:outline-none focus:ring-2 text-sm';
  const borderCls = error
    ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
    : 'border-gray-300 dark:border-gray-700 focus:ring-black dark:focus:ring-white';
  return `${base} ${borderCls} ${extra}`.trim();
}
