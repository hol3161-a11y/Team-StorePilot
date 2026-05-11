"use client";

import { useEffect, useState } from "react";
import styles from "../app/landing.module.scss";

export default function Typing() {
    const texts = [
        "이번 주 매출 예측해줘",
        "재고 부족 상품 알려줘",
        "이번 달 인건비 계산해서 보여줘",
    ];

    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");

    useEffect(() => {
        let i = 0;
        const current = texts[textIndex];

        const typing = setInterval(() => {
            setDisplayText(current.slice(0, i + 1));
            i++;

            if (i === current.length) {
                clearInterval(typing);

                setTimeout(() => {
                    setDisplayText("");
                    setTextIndex((prev) => (prev + 1) % texts.length);
                }, 1300); //멈춤 시간
            }
        }, 100); //타이핑 속도

        return () => clearInterval(typing);
    }, [textIndex]);

    return (
        <div className={styles.chat_preview}>
            <p className={styles.cursor}>{displayText}</p>
        </div>
    )
}