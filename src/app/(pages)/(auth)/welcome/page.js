import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOption } from '@/app/api/auth/[...nextauth]/route'
import styles from './welcom.module.scss'

export default async function page({ searchParams }) {
  const { name } = await searchParams;
  const session = await getServerSession(authOption);
  const displayName =
    (typeof name === 'string' && name) ||
    session?.user?.name ||
    '';

  return (
    <div className={styles.container}>

      <div className={styles.check}>
        <svg className={styles.checkSvg} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" className={styles.checkCircle} />
          <path d="M30 52 L45 67 L72 38" className={styles.checkMark} />
        </svg>
      </div>

      <div className={styles.completeText}>
        <h1>가입이 완료됐어요, {displayName} 님</h1>
        <span>매장 정보를 등록하면 더 빠르게 시작할 수 있어요</span>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine}></span>
        <span className={styles.dividerText}> 이렇게 활용해보세요 </span>
        <span className={styles.dividerLine}></span>
      </div>

      <ul className={styles.featureList}>
        <li className={styles.featureCard}>
          <img src="/img/icon/increase.svg" alt="" />
          <h3>매출 트렌드 분석</h3>
          <p>일·주·월<br />매출 흐름을 한 눈에</p>
        </li>

        <li className={styles.featureCard}>
          <span className={styles.inventoryIcon}></span>
          <h3>AI 재고 및 인력 관리</h3>
          <p>AI를 활용한 발주 예측과<br />예상 매출 기반 배치인력 추천</p>
        </li>

        <li className={styles.featureCard}>
          <img src="/img/icon/trade-area.svg" alt="" />
          <h3>주변 상권 분석</h3>
          <p>주소 등록 사용자에 한해<br />주변 상권 분석 리포트 제공</p>
        </li>
      </ul>

      <div className={styles.actionGroup}>
        <Link href="/onboarding/store-info" className={styles.primaryButton}>지금 등록</Link>
        <Link href="/main" className={styles.secondaryButton}>둘러보기</Link>
      </div>
    </div>
  )
}
