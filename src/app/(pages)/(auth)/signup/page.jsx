'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from './signup.module.scss'
import axios from 'axios'



const page = () => {
  const router = useRouter();
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

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const triggerShake = (setter) => {
    setter(false);
    requestAnimationFrame(() => setter(true));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    await axios.post('/api/user', { name, email, password });
    router.push(`/welcome?name=${encodeURIComponent(name)}`);
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
        <div className={styles.kakao} onClick={() => signIn('kakao', { callbackUrl: '/' })}>
          <img src="/img/loginbtn/kakao_signUp.png" alt="카카오 회원가입" />
        </div>
        <div className={styles.naver} onClick={() => signIn('naver', { callbackUrl: '/' })}>
          <img src="/img/loginbtn/naver_signUp.png" alt="네이버 회원가입" />
        </div>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine}></span>
        <span className={styles.dividerText}>또는 이메일로 가입</span>
        <span className={styles.dividerLine}></span>
      </div>

      <form className={styles.signupForm} onSubmit={handleSubmit} noValidate>

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
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(false);
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

export default page
