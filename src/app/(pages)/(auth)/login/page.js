'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.scss';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const ERROR_MESSAGES = {
  NotRegistered: '가입되지 않은 이메일입니다. 하단의 회원가입을 진행해주세요',
};

const handleSocialLogin = (provider) => {
  document.cookie = 'auth_intent=login; path=/; max-age=300; SameSite=Lax';
  signIn(provider, { callbackUrl: '/main' });
};

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      setErrorMsg(ERROR_MESSAGES[errorCode]);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // 빈 칸 체크
    if (!email.trim() || !password) {
      setErrorMsg('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // NextAuth의 signIn 사용
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
      });

      if (result.error) {
        // 로그인 실패
        setErrorMsg(result.error);
      } else {
        // 로그인 성공
        if (typeof window !== 'undefined') {
          localStorage.setItem('storePilot.email', email);
        }
        router.push('/main');
      }

    } catch (error) {
      setErrorMsg('로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요');
    } finally {
      setSubmitting(false);
    }
  };

  const [test, setTest] = useState(false);

  return (
    <>
      <div className={styles.container}>

        <div className={styles.brand}>
          <span className={styles.brandTitle}>
            <span className={styles.brandTitle1}>Store</span>
            <span className={styles.brandTitle2}>Pilot</span>
          </span>

          <div className={styles.brandDescription}>
            매장 운영을 더 스마트하게 ㅡ AI 기반 재고·매출 관리
          </div>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>

          <div className={styles.inputGroup}>
            <div className={styles.box}>
              <span>이메일</span>
              <input
                type="email"
                className={styles.boxText}
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
              />
            </div>

            <div className={styles.box}>
              <span>비밀번호</span>
              <div className={styles.passWord}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.boxText}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
                <img
                  src={showPassword ? '/img/icon/eye_off.svg' : '/img/icon/eye.svg'}
                  alt={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  onClick={() => setShowPassword((v) => !v)}
                />
              </div>
            </div>

            {errorMsg && (
              <p className={styles.errorText}>⚠ {errorMsg}</p>
            )}
          </div>

          <button type="submit" className={styles.loginBtn} disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerLine}></span>
          <span className={styles.dividerText}> 또는 </span>
          <span className={styles.dividerLine}></span>
        </div>


        <div className={styles.socialLoginBtn}>
          <div className={styles.google} onClick={() => handleSocialLogin('google')}>
            <img src="/img/loginbtn/google_login_btn.png" alt="구글 로그인" />
          </div>
          <div className={styles.naver} onClick={() => handleSocialLogin('naver')}>
            <img src="/img/loginbtn/naver_login_btn.png" alt="네이버 로그인" />
          </div>
        </div>

        <div className={styles.signupPrompt}>
          <span className={styles.signupText}>아직 계정이 없나요?</span>
          <Link href="/signup" className={styles.signupLink}>
            회원가입
          </Link>
        </div>
      </div>

      <div className={`${styles.testAccount} ${test ? styles.off : ''}`}>
        <div>
          <h3>TEST ACCOUNT</h3>
          <button onClick={() => {setTest(true)}}>
            <img src="./img/icon/ic-x.svg" alt="x버튼"/>
          </button>
        </div>
        <p>아이디 : qwe@email.com</p>
        <p>비밀번호 : qweqwe</p>
      </div>
    </>
  )
}


const page = () => {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

export default page