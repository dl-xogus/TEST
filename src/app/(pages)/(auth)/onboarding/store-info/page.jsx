'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './storeInfo.module.scss';

const INDUSTRIES = [
  { key: 'restaurant', label: '요식업', icon: '/img/icon/ic-restaurant.svg' },
  { key: 'cafe', label: '카페', icon: '/img/icon/ic-cafe.svg' },
  { key: 'other', label: '기타', icon: '/img/icon/ic-dots.svg' },
];

const Page = () => {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [industry, setIndustry] = useState('restaurant');
  const [customIndustry, setCustomIndustry] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('storePilot.industry', industry);
      localStorage.setItem('storePilot.customIndustry', customIndustry);
    }
    router.push('/onboarding/store-setting');
  };

  return (
    <div className={styles.container}>

      <Link href="/welcome" className={styles.backLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        이전 단계
      </Link>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>1. 계정 정보</span>
        </li>
        <li className={`${styles.step} ${styles.active}`}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>2. 매장 정보</span>
        </li>
        <li className={styles.step}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>3. 매장 세팅</span>
        </li>
      </ol>

      <div className={styles.heading}>
        <h1>매장 정보</h1>
        <span>언제든 설정에서 바꿀 수 있어요</span>
      </div>

      <form className={styles.storeInfoForm} onSubmit={handleSubmit}>

        <div className={styles.box}>
          <span className={styles.boxLabel}>매장 이름</span>
          <input
            type="text"
            className={styles.boxText}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>

        <div className={styles.box}>
          <span className={styles.boxLabel}>업종</span>
          <div className={styles.industries}>
            {INDUSTRIES.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`${styles.industryCard} ${industry === item.key ? styles.active : ''}`}
                onClick={() => setIndustry(item.key)}
              >
                <span
                  className={styles.industryIcon}
                  style={{ '--icon': `url(${item.icon})` }}
                />
                <span className={styles.industryLabel}>{item.label}</span>
              </button>
            ))}
          </div>
          <div className={`${styles.customIndustryWrapper} ${industry === 'other' ? styles.open : ''}`}>
            <input
              type="text"
              className={styles.boxText}
              placeholder="업종을 직접 입력하세요"
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              tabIndex={industry === 'other' ? 0 : -1}
            />
          </div>
        </div>

        <div className={styles.box}>
          <span className={styles.boxLabel}>주소</span>
          <div className={styles.addressInput}>
            <span className={styles.addressIcon} />
            <input
              type="text"
              className={styles.boxText}
              placeholder="주소를 입력하세요"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className={styles.nextBtn}>
          다 음
        </button>
      </form>

    </div>
  )
}

export default Page
