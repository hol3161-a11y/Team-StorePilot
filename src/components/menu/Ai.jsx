'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/(pages)/menu/menu.module.scss';
import useAIStore from '@/store/aiStore';

export default function MenuCallAi() {
    const { menu, loading } = useAIStore();

    const [typedMaxText, setTypedMaxText] = useState('');
    const [typedMinText, setTypedMinText] = useState('');

    const isLoading = loading.menu;

    useEffect(() => {
        if (!menu || isLoading) return;

        const maxText = `메뉴명: ${menu?.max?.name || ''}\n${menu?.max?.summary || ''}\n💡 ${menu?.max?.advice || ''}`;
        const minText = `메뉴명: ${menu?.min?.name || ''}\n${menu?.min?.summary || ''}\n💡 ${menu?.min?.advice || ''}`;

        let maxIndex = 0;
        let minIndex = 0;

        setTypedMaxText('');
        setTypedMinText('');

        const maxTimer = setInterval(() => {
            setTypedMaxText(maxText.slice(0, maxIndex + 1));
            maxIndex++;

            if (maxIndex >= maxText.length) {
                clearInterval(maxTimer);
            }
        }, 35);

        const minTimer = setInterval(() => {
            setTypedMinText(minText.slice(0, minIndex + 1));
            minIndex++;

            if (minIndex >= minText.length) {
                clearInterval(minTimer);
            }
        }, 35);

        return () => {
            clearInterval(maxTimer);
            clearInterval(minTimer);
        };
    }, [menu, isLoading]);

    const [maxName = '', maxSummary = '', maxAdvice = ''] = typedMaxText.split('\n');
    const [minName = '', minSummary = '', minAdvice = ''] = typedMinText.split('\n');

    return (
        <div className={styles.graph}>
            <div className={styles.AItitle}>
                <p><img src="./img/icon/ic-AI.svg" alt="AI아이콘" /></p>
                <h3>AI 분석</h3>
            </div>

            <div className={styles.AllaiBox}>
                <div className={styles.aiBox}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai1.svg" alt="AI아이콘" /></p>
                        <span>인기 메뉴</span>
                    </div>

                    <div className={styles.aiBox2_text}>
                        {isLoading ? (
                            <p className={styles.loadingText}>AI 분석 중</p>
                        ) : !menu ? (
                            <p className={styles.emptyText}>매출 데이터가 없습니다.</p>
                        ) : (
                            <>
                                <ul className={styles.menuName}>
                                    <li>{maxName}</li>
                                </ul>

                                <ul className={styles.aiText}>
                                    <li className={styles.menuSummaryText}>
                                        {maxSummary}
                                    </li>

                                    <li className={styles.menuAiSuggestion}>
                                        {maxAdvice}
                                    </li>
                                </ul>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.aiBox2}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai2.svg" alt="AI아이콘" /></p>
                        <span>판매 부진</span>
                    </div>

                    <div className={styles.aiBox2_text}>
                        {isLoading ? (
                            <p className={styles.loadingText}>AI 분석 중</p>
                        ) : !menu ? (
                            <p className={styles.emptyText}>매출 데이터가 없습니다.</p>
                        ) : (
                            <>
                                <ul className={styles.menuName}>
                                    <li>{minName}</li>
                                </ul>

                                <ul className={styles.aiText}>
                                    <li className={styles.menuSummaryText}>
                                        {minSummary}
                                    </li>

                                    <li className={styles.menuAiSuggestion}>
                                        {minAdvice}
                                    </li>
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}