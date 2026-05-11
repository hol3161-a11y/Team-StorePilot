"use client";

import React from 'react'
import style from '@/app/(pages)/main/main.module.scss'
import { useState, useEffect } from "react";
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import useAIStore from '@/store/aiStore'
import { getTodayLaborCost } from '@/lib/utils/employeeCalc'


import axios from 'axios'

export default function MainClient() {

    const { data: session } = useSession();
    const ownerId = session?.user?.email
        ?? (typeof window !== 'undefined' ? localStorage.getItem('storePilot.email') : null);

    const [input, setInput] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    // 추가 state
    const [displayAnswer, setDisplayAnswer] = useState("");

    // answer 타이핑 효과
    useEffect(() => {
        if (!answer) {
            setDisplayAnswer("");
            return;
        }

        let index = 0;
        setDisplayAnswer("");

        const timer = setInterval(() => {
            if (index >= answer.length) {
                clearInterval(timer);
                return;
            }

            const nextChar = answer.charAt(index);

            setDisplayAnswer((prev) => prev + nextChar);

            index++;
        }, 20);

        return () => clearInterval(timer);
    }, [answer]);


    const quickQuestions = [
        "이번 달 인건비 얼마나 나가?",
        "이번 주 매출 지난주 대비 얼마나 차이나?",
        "오늘 매출 예상 얼마야?",
        "현재 재고 부족한 항목 있어?",
        "요즘 잘 안 팔리는 메뉴 뭐야?",
        "폐기 위험 있는 재고 알려줘",
        "오늘 근무하는 인원 누구야?",
        "요즘 잘 팔리는 메뉴 뭐야?"
    ];

    // 추가: 처음에는 고정 2개로 시작
    const [randomQuestions, setRandomQuestions] = useState(quickQuestions.slice(0, 2));

    // 랜덤 2개 뽑기 함수
    function getRandomQuestions(arr, count) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // 추가: 마운트 후에만 랜덤 적용
    useEffect(() => {
        setRandomQuestions(getRandomQuestions(quickQuestions, 2));
    }, []);


    /* 예상 매출액 - store에서 읽기 */
    const { sales } = useAIStore();

    // 인건비
    const [employees, setEmployees] = useState([])

    const today = new Date()

    useEffect(() => {
        axios.get('/api/employee/db', {
            params: {
                ownerId: ownerId
            }
        })
            .then(res => {
                setEmployees(res.data.employees || [])
            })
            .catch(err => {
                console.error('직원 조회 실패', err)
            })
    }, [])

    const todayLaborCost = getTodayLaborCost(employees, today)

    async function handleAsk(item) {
        if (loading) return
        const finalQuestion = item || input

        if (!finalQuestion.trim()) return

        setCurrentQuestion("질문 : " + finalQuestion)

        setAnswer("");
        setDisplayAnswer("");

        setLoading(true)

        try {
            const res = await axios.post('/api/chat/openai', {
                question: finalQuestion,
                ownerId,
                storeId: '001'
            })

            setAnswer(res.data.answer)
            setInput('')
        } catch (err) {
            console.error('❌ 챗봇 호출 실패:', err)
            setAnswer('호출 실패')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    return (
        <main className={style.main}>
            <section>
                <div className={style.inner}>

                    <div className={style.chatTop}>
                        <h1>오늘 무엇을 도와드릴까요?</h1>

                        <form
                            className={style.inputWrap}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAsk();
                            }}
                        >
                            <input
                                type='text'
                                placeholder="질문을 입력하세요"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button type="submit" disabled={loading}>
                                <img src='/img/icon/ic-enter.png' />
                            </button>
                        </form>

                        <div className={style.quickList}>
                            {randomQuestions.map((item, i) => (
                                <button
                                    key={i}
                                    className={style.bubble}
                                    disabled={loading}
                                    onClick={() => handleAsk(item)}
                                >
                                    <svg width="297" height="54" viewBox="0 0 297 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M276 0.5V0V0V0.5ZM276 41.5V42V42V41.5ZM39.9844 41.5V41H39.8376L39.7142 41.0793L39.9844 41.5ZM8 52.5L7.59122 52.2121L6.85967 53.2507L8.10287 52.9893L8 52.5ZM16.1553 40.9219L16.564 41.2098L16.9872 40.609L16.273 40.4359L16.1553 40.9219ZM21 0.5V0V0V0.5ZM276 0.5V1C287.046 1 296 9.95431 296 21H296.5H297C297 9.40202 287.598 4.23193e-06 276 0V0.5ZM296.5 21H296C296 32.0457 287.046 41 276 41V41.5V42C287.598 42 297 32.598 297 21H296.5ZM276 41.5V41H39.9844V41.5V42H276V41.5ZM39.9844 41.5L39.7142 41.0793C36.2076 43.3315 30.5123 45.5928 24.5369 47.5324C18.5732 49.4682 12.3765 51.069 7.89713 52.0107L8 52.5L8.10287 52.9893C12.6165 52.0404 18.8476 50.4305 24.8456 48.4836C30.8319 46.5405 36.6324 44.2471 40.2546 41.9207L39.9844 41.5ZM8 52.5L8.40878 52.7879L16.564 41.2098L16.1553 40.9219L15.7465 40.6339L7.59122 52.2121L8 52.5ZM16.1553 40.9219L16.273 40.4359C7.50866 38.3121 1 30.4165 1 21H0.5H0C0 30.8888 6.83513 39.1778 16.0375 41.4078L16.1553 40.9219ZM0.5 21H1C1 9.95431 9.95431 1 21 1V0.5V0C9.40202 5.66244e-07 0 9.40202 0 21H0.5ZM21 0.5V1H276V0.5V0H21V0.5Z" fill="currentColor" />
                                    </svg>

                                    <span>{item}</span>
                                </button>
                            ))}
                        </div>

                    </div>

                    <div className={style.answerBox}>
                        <div className={style.scrollBox}>
                            <div className={style.questionPreview}>
                                <span>{currentQuestion}</span>
                                <p></p>
                            </div>
                            <div className={style.answerContent}>
                                <pre>
                                    {loading ? '분석 중' : displayAnswer}
                                    {loading && <span className={style.dots}></span>}
                                </pre>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <aside className={style.summary}>

                <div className={style.summaryTitle}>
                    <Link href="/dashboard">
                        <p>오늘 요약
                            <span className={style.tooltip}>상세 보기</span>
                        </p>
                        <span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.1717 11.9997L8.22168 7.04972L9.63568 5.63672L15.9997 11.9997L9.63568 18.3637L8.22168 16.9487L13.1717 11.9997Z" fill="currentColor" />
                            </svg>
                        </span>

                    </Link>
                </div>

                <div className={style.cardWrap}>
                    <div className={style.summaryCard}>
                        <div className={style.summaryInner}>
                            <p><img src='/img/icon/ic-main-sales.png' /></p>
                            <div className={style.summaryText}>
                                <p>예상 매출</p>
                                <strong>{sales?.predictedAmount.toLocaleString() ?? '-'} 원</strong>
                            </div>
                        </div>
                    </div>

                    <div className={style.summaryCard}>
                        <div className={style.summaryInner}>
                            <p><img src='/img/icon/ic-main-staff.png' /></p>
                            <div className={style.summaryText}>
                                <p>예상 인건비</p>
                                <strong>{todayLaborCost.toLocaleString()}원</strong>
                            </div>
                        </div>
                    </div>

                    <div className={style.summaryCard}>
                        <div className={style.summaryInner}>
                            <p><img src='/img/icon/ic-main-stock.png' /></p>
                            <div className={style.summaryText}>
                                <p>부족 재고</p>
                                <strong>2개</strong>
                            </div>
                        </div>
                    </div>

                    <div className={style.summaryCard}>
                        <div className={style.summaryInner}>
                            <p><img src='/img/icon/ic-main-danger.png' /></p>
                            <div className={style.summaryText}>
                                <p>폐기 위험</p>
                                <strong>1개</strong>
                            </div>
                        </div>
                    </div>
                </div>

            </aside>
        </main >
    )
}