'use client';

import useAIStore from '@/store/aiStore';
import styles from './Analytics.module.scss';

export default function ScheduleCallAi() {
  const { schedule, loading } = useAIStore();

  const isLoading = loading.schedule;

  return (
    <div className={styles.analyticsAi}>
      <div className={styles.analyticsHeader}>
        <div className={styles.headerLeft}>
          <img src="./img/icon/ic-AI.svg" alt="AI 아이콘" />
          <h2>AI 분석</h2>
        </div>
      </div>

      <div className={styles.analyticsList}>
        <ul>
          <li>

            {/* 요약 */}
            <span>
              {isLoading
                ? 'AI 분석 중...'
                : !schedule
                ? '근무 데이터가 없습니다.'
                : schedule.summary}
            </span>

            {/* 조언 */}
            <span>
              {isLoading
                ? '잠시만 기다려주세요.'
                : !schedule
                ? '직원 스케줄을 추가해 주세요.'
                : schedule.advice}
            </span>

          </li>
        </ul>
      </div>
    </div>
  );
}
