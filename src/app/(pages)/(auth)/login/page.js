'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.scss';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import axios from 'axios';

const page = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setErrorMsg('이메일과 비밀번호를 입력해주세요');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const { data } = await axios.post('/api/login', { email, password });
      if (data?.ok) {
        router.push('/main');
      } else {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다');
      }
    } catch (err) {
      setErrorMsg('로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
              />
              <img
                src={showPassword ? '/img/icon/eye_off.svg' : '/img/icon/eye.svg'}
                alt={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                onClick={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>

          {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
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
        <div className={styles.kakao} onClick={() => signIn('kakao', { callbackUrl: '/main' })}>
          <img src="/img/loginbtn/kakao_login_btn.png" alt="카카오 로그인" />
        </div>
        <div className={styles.naver} onClick={() => signIn('naver', { callbackUrl: '/main' })}>
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
  )
}


export default page
