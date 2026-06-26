'use client';

import { useState, useEffect } from 'react';
import useAIStore from '@/store/aiStore';
import styles from './Analytics.module.scss';

export default function ScheduleCallAi() {
  const { schedule, loading } = useAIStore();

  const isLoading = loading.schedule;

  const [typedText, setTypedText] = useState('');
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isLoading) {
      setDots('');
      return;
    }

    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!schedule || isLoading) return;

    const fullText = `${schedule.summary}\n→ ${schedule.advice}`;

    let index = 0;
    setTypedText('');

    const timer = setInterval(() => {
      setTypedText(fullText.slice(0, index + 1));
      index++;

      if (index >= fullText.length) {
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [schedule, isLoading]);

  const [typedSummary = '', typedAdvice = ''] = typedText.split('\n');

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
            {isLoading ? (
              <>
                <span className={styles.summary}>AI 분석 중{dots}</span>

                <div className={styles.aiSuggestion}>
                  <strong>AI 제안</strong>
                  <span>잠시만 기다려주세요.</span>
                </div>
              </>
            ) : !schedule ? (
              <>
                <span className={styles.summary}>근무 데이터가 없습니다.</span>

                <div className={styles.aiSuggestion}>
                  <strong>AI 제안</strong>
                  <span>직원 스케줄을 추가해 주세요.</span>
                </div>
              </>
            ) : (
              <>
                <span className={styles.summary}>{typedSummary}</span>

                <div className={styles.aiSuggestion}>
                  <strong>AI 제안</strong>
                  <span>{typedAdvice}</span>
                </div>
              </>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}