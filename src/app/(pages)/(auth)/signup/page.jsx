'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from './signup.module.scss'
import axios from 'axios'

const ERROR_MESSAGES = {
  AlreadyRegistered: '이미 가입된 이메일입니다. 로그인을 진행해주세요',
};

const handleSocialSignup = (provider) => {
  document.cookie = 'auth_intent=signup; path=/; max-age=300; SameSite=Lax';
  signIn(provider, { callbackUrl: '/welcome' });
};

const SignupContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [nameShake, setNameShake] = useState(false);
  const [emailShake, setEmailShake] = useState(false);
  const [passwordShake, setPasswordShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      setErrorMessage(ERROR_MESSAGES[errorCode]);
    }
  }, [searchParams]);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const triggerShake = (setter) => {
    setter(false);
    requestAnimationFrame(() => setter(true));
  };

  const validateEmail = (value) => {
    if (!value.trim()) return '이메일을 입력해주세요';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '올바른 이메일 형식이 아닙니다';
    return null;
  };

  const validatePassword = (value) => {
    if (!value.trim()) return '비밀번호를 입력해주세요';
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. 빈 칸 검증
    const nameEmpty = name.trim().length === 0;
    const emailEmpty = email.trim().length === 0;
    const passwordEmpty = password.length === 0;

    if (nameEmpty || emailEmpty || passwordEmpty) {
      if (nameEmpty) {
        setNameError(true);
        triggerShake(setNameShake);
      }
      if (emailEmpty) {
        setEmailError(true);
        triggerShake(setEmailShake);
      }
      if (passwordEmpty) {
        setPasswordError(true);
        triggerShake(setPasswordShake);
      }
      if (nameEmpty) nameRef.current?.focus();
      else if (emailEmpty) emailRef.current?.focus();
      else if (passwordEmpty) passwordRef.current?.focus();
      return;
    }

    // 2. 이메일 형식 검증
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(true);
      triggerShake(setEmailShake);
      setErrorMessage(emailValidation);
      emailRef.current?.focus();
      return;
    }

    // 3. 비밀번호 길이 검증
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(true);
      triggerShake(setPasswordShake);
      setErrorMessage(passwordValidation);
      passwordRef.current?.focus();
      return;
    }

    try {
      // 4. 회원가입 API 호출
      const response = await axios.post('/api/auth/signup', {
        name,
        email,
        password
      });

      // 5. 성공 → localStorage 저장 후 welcome 페이지로
      if (typeof window !== 'undefined') {
        localStorage.setItem('storePilot.email', email);
      }
      router.push(`/welcome?name=${encodeURIComponent(name)}`);

    } catch (error) {
      // 6. 실패 처리
      if (error.response) {
        // 서버에서 에러 응답 온 경우
        const errorMsg = error.response.data.error;
        setErrorMessage(errorMsg);
        
        if (errorMsg.includes('이메일')) {
          setEmailError(true);
          triggerShake(setEmailShake);
          emailRef.current?.focus();
        }
      } else {
        // 네트워크 에러 등
        setErrorMessage('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className={styles.container}>

      <Link href="/login" className={styles.backLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        로그인으로 돌아가기
      </Link>

      <ol className={styles.steps}>
        <li className={`${styles.step} ${styles.active}`}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>1. 계정 정보</span>
        </li>
        <li className={styles.step}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>2. 매장 정보</span>
        </li>
        <li className={styles.step}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>3. 매장 세팅</span>
        </li>
      </ol>

      <div className={styles.heading}>
        <h1>계정 만들기</h1>
        <span>30초면 가입이 끝나요</span>
      </div>

      <div className={styles.socialSignupBtn}>
        <div className={styles.google} onClick={() => handleSocialSignup('google')}>
          <img src="/img/loginbtn/google_signUP.png" alt="구글 회원가입" />
        </div>
        <div className={styles.naver} onClick={() => handleSocialSignup('naver')}>
          <img src="/img/loginbtn/naver_signUp.png" alt="네이버 회원가입" />
        </div>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine}></span>
        <span className={styles.dividerText}>또는 이메일로 가입</span>
        <span className={styles.dividerLine}></span>
      </div>

      <form className={styles.signupForm} onSubmit={handleSubmit} noValidate>

        {errorMessage && (
          <div className={styles.errorBox}>
            <p className={styles.errorText}>⚠ {errorMessage}</p>
          </div>
        )}

        <div className={styles.inputGroup}>
          <div className={styles.box}>
            <span>이름</span>
            <input
              ref={nameRef}
              type="text"
              name="name"
              className={`${styles.boxText} ${nameError ? styles.boxTextError : ''} ${nameShake ? styles.shake : ''}`}
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(false);
                if (errorMessage) setErrorMessage('');
              }}
              onAnimationEnd={() => setNameShake(false)}
            />
          </div>

          <div className={styles.box}>
            <span>이메일</span>
            <input
              ref={emailRef}
              type="email"
              name="email"
              className={`${styles.boxText} ${emailError ? styles.boxTextError : ''} ${emailShake ? styles.shake : ''}`}
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(false);
                if (errorMessage) setErrorMessage('');
              }}
              onAnimationEnd={() => setEmailShake(false)}
            />
          </div>

          <div className={styles.box}>
            <span>비밀번호</span>
            <div
              className={`${styles.passWord} ${passwordShake ? styles.shake : ''}`}
              onAnimationEnd={() => setPasswordShake(false)}
            >
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                className={`${styles.boxText} ${passwordError ? styles.boxTextError : ''}`}
                placeholder="비밀번호를 입력하세요 (8자 이상)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(false);
                  if (errorMessage) setErrorMessage('');
                }}
                name="password"
              />
              <img
                src={showPassword ? '/img/icon/eye_off.svg' : '/img/icon/eye.svg'}
                alt={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                onClick={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>
        </div>

        <button type="submit" className={styles.nextBtn}>
          다 음
        </button>
      </form>

      <div className={styles.loginPrompt}>
        <span className={styles.loginText}>이미 계정이 있으신가요?</span>
        <Link href="/login" className={styles.loginLink}>로그인</Link>
      </div>

    </div>
  )
}

const page = () => {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}

export default page