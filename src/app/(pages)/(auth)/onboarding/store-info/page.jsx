'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import styles from './storeInfo.module.scss';
import DaumPostcode from 'react-daum-postcode';

const INDUSTRIES = [
  { key: 'restaurant', label: '요식업', icon: '/img/icon/ic-restaurant.svg' },
  { key: 'cafe', label: '카페', icon: '/img/icon/ic-cafe.svg' },
  { key: 'other', label: '기타', icon: '/img/icon/ic-dots.svg' },
];

const Page = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [storeName, setStoreName] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [showPostcode, setShowPostcode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [storeNameError, setStoreNameError] = useState(false);
  const [industryError, setIndustryError] = useState(false);
  const [customIndustryError, setCustomIndustryError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [storeNameShake, setStoreNameShake] = useState(false);
  const [industryShake, setIndustryShake] = useState(false);
  const [customIndustryShake, setCustomIndustryShake] = useState(false);
  const [addressShake, setAddressShake] = useState(false);

  const storeNameRef = useRef(null);

  const triggerShake = (setter) => {
    setter(false);
    requestAnimationFrame(() => setter(true));
  };

  const handleAddressComplete = (data) => {
    setAddress(data.address);
    setDetailAddress('');
    setAddressError(false);
    setShowPostcode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const storeNameEmpty = !storeName.trim();
    const addressEmpty = !address.trim();
    const industryEmpty = !industry;
    const customIndustryEmpty = industry === 'other' && !customIndustry.trim();

    if (storeNameEmpty || addressEmpty || industryEmpty || customIndustryEmpty) {
      if (storeNameEmpty) {
        setStoreNameError(true);
        triggerShake(setStoreNameShake);
      }
      if (industryEmpty) {
        setIndustryError(true);
        triggerShake(setIndustryShake);
      }
      if (customIndustryEmpty) {
        setCustomIndustryError(true);
        triggerShake(setCustomIndustryShake);
      }
      if (addressEmpty) {
        setAddressError(true);
        triggerShake(setAddressShake);
      }
      if (storeNameEmpty) storeNameRef.current?.focus();
      return;
    }

    const ownerEmail =
      session?.user?.email ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('storePilot.email')
        : null);

    if (!ownerEmail) {
      setErrorMsg('로그인 정보를 찾을 수 없어요. 다시 로그인해주세요.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const { data } = await axios.post('/api/store', {
        ownerEmail,
        storeName,
        industry,
        customIndustry,
        address,
        detailAddress,
      });

      if (!data?.ok) {
        setErrorMsg(data?.error ?? '저장에 실패했어요. 잠시 후 다시 시도해주세요.');
        setSubmitting(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('storePilot.industry', industry);
        localStorage.setItem('storePilot.customIndustry', customIndustry);
      }
      router.push('/onboarding/store-setting');
    } catch (err) {
      console.error(err);
      setErrorMsg('저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
    }
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
            ref={storeNameRef}
            type="text"
            className={`${styles.boxText} ${storeNameError ? styles.boxTextError : ''} ${storeNameShake ? styles.shake : ''}`}
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value);
              if (storeNameError) setStoreNameError(false);
            }}
            onAnimationEnd={() => setStoreNameShake(false)}
          />
          {storeNameError && (
            <p className={styles.errorText}>⚠ 매장 이름을 입력해주세요</p>
          )}
        </div>

        <div className={styles.box}>
          <span className={styles.boxLabel}>업종</span>
          <div
            className={`${styles.industries} ${industryShake ? styles.shake : ''}`}
            onAnimationEnd={() => setIndustryShake(false)}
          >
            {INDUSTRIES.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`${styles.industryCard} ${industry === item.key ? styles.active : ''}`}
                onClick={() => {
                  setIndustry(item.key);
                  if (industryError) setIndustryError(false);
                }}
              >
                <span
                  className={styles.industryIcon}
                  style={{ '--icon': `url(${item.icon})` }}
                />
                <span className={styles.industryLabel}>{item.label}</span>
              </button>
            ))}
          </div>
          {industryError && (
            <p className={styles.errorText}>⚠ 매장 업종을 선택해주세요</p>
          )}
          <div className={`${styles.customIndustryWrapper} ${industry === 'other' ? styles.open : ''}`}>
            <input
              type="text"
              className={`${styles.boxText} ${customIndustryError ? styles.boxTextError : ''} ${customIndustryShake ? styles.shake : ''}`}
              placeholder="업종을 직접 입력하세요"
              value={customIndustry}
              onChange={(e) => {
                setCustomIndustry(e.target.value);
                if (customIndustryError) setCustomIndustryError(false);
              }}
              onAnimationEnd={() => setCustomIndustryShake(false)}
              tabIndex={industry === 'other' ? 0 : -1}
            />
            {customIndustryError && (
              <p className={styles.errorText}>⚠ 매장 업종을 입력해주세요</p>
            )}
          </div>
        </div>

        <div className={styles.box}>
          <span className={styles.boxLabel}>주소</span>
          <div className={`${styles.addressInput} ${addressShake ? styles.shake : ''}`}
            onAnimationEnd={() => setAddressShake(false)}
          >
            <span className={styles.addressIcon} />
            <input
              type="text"
              className={`${styles.boxText} ${addressError ? styles.boxTextError : ''}`}
              placeholder="주소를 입력하세요"
              value={address}
              readOnly
              onClick={() => setShowPostcode(true)}
            />
            <button
              type="button"
              className={styles.searchBtn}
              onClick={() => setShowPostcode(true)}
            >
              주소 찾기
            </button>
          </div>
          {addressError && (
            <p className={styles.errorText}>⚠ 주소를 입력해주세요</p>
          )}
          <div className={`${styles.detailAddressWrapper} ${address ? styles.open : ''}`}>
            <input
              type="text"
              className={styles.boxText}
              placeholder="상세주소를 입력하세요 (예: 3층 302호)"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              tabIndex={address ? 0 : -1}
            />
          </div>
        </div>

        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

        <button type="submit" className={styles.nextBtn} disabled={submitting}>
          {submitting ? '저장 중...' : '다 음'}
        </button>
      </form>

      {showPostcode && (
        <div className={styles.postcodeOverlay} onClick={() => setShowPostcode(false)}>
          <div className={styles.postcodeModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.postcodeHeader}>
              <h3>주소 검색</h3>
              <button type="button" onClick={() => setShowPostcode(false)}>✕</button>
            </div>
            <DaumPostcode onComplete={handleAddressComplete} />
          </div>
        </div>
      )}


    </div>
  )
}

export default Page
