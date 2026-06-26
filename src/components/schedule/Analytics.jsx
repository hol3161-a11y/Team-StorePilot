"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Analytics.module.scss";
import useAIStore from "@/store/aiStore";
import ScheduleCallAi from "@/components/schedule/Ai";

function Analytics({ employees = [] }) {
  const [payType, setPayType] = useState("day");
  const [aiResult, setAiResult] = useState(null);
  const { schedule } = useAIStore();

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await axios.post("/api/ai", {
          keyword: "schedule",
        });

        setAiResult(res.data);
      } catch (e) {
        console.error(e);
      }
    };

    //fetchAI();

    setAiResult(schedule);
  }, [schedule]);

  console.log(schedule);

  // 근무 요일 수
  const getWorkDays = (emp) => {
    if (!emp.days) return 0;

    if (emp.days.includes("주말")) return 2;

    return emp.days.split("/").length;
  };

  // 시간 계산
  const calcHours = (emp) => {
    if (!emp.time) return 0;

    const [start, end] = emp.time.split("-");

    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    let diff = toMin(end) - toMin(start);

    // 🔥 야간 근무 처리
    if (diff < 0) {
      diff += 24 * 60;
    }

    return diff / 60;
  };

  // 급여 계산
  const calcPay = (emp) => {
    const hours = calcHours(emp);
    const wage = emp.hourlyWage || 0;

    const dayPay = hours * wage;

    const workDays = getWorkDays(emp);

    if (payType === "day") return Math.round(dayPay);
    if (payType === "week") return Math.round(dayPay * workDays);
    if (payType === "month") return Math.round(dayPay * workDays * 4);

    return Math.round(dayPay);
  };

  // 총 인건비
  const total = employees.reduce((sum, emp) => {
    return sum + calcPay(emp);
  }, 0);

  return (
    <div className={styles.analytics}>
      {/* AI 분석 */}
      <ScheduleCallAi />

      {/* 직원별 인건비 */}
      <div className={styles.employee}>
        <div className={styles.analyticsHeader}>
          <div className={styles.headerLeft}>
            <img src="./img/icon/ic_schedul-analytics.svg" alt="아이콘" />
            <h2>직원별 인건비 분석</h2>
          </div>

          <div className={styles.btn}>
            <button
              className={payType === "day" ? styles.activeBtn : ""}
              onClick={() => setPayType("day")}
            >
              일급
            </button>

            <button
              className={payType === "week" ? styles.activeBtn : ""}
              onClick={() => setPayType("week")}
            >
              주급
            </button>

            <button
              className={payType === "month" ? styles.activeBtn : ""}
              onClick={() => setPayType("month")}
            >
              월급
            </button>
          </div>
        </div>

        <ul className={styles.employeeList}>
          {employees.length === 0 && (
            <li className={styles.empty}>분석할 직원 데이터가 없어요</li>
          )}

          {employees.map((emp, i) => (
            <li key={i} className={styles.employeeItem}>
              <span>{emp.name}</span>

              <span>근무 시간 {emp.time}</span>

              <span className={styles.payDetail}>
                {Math.round(calcHours(emp))}시간 ×{" "}
                {emp.hourlyWage?.toLocaleString()}원 ={" "}
                <strong>{calcPay(emp).toLocaleString()}원</strong>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 총 인건비 */}
      <div className={styles.employeeTotal}>
        <span>총 인건비</span>

        <span>{total.toLocaleString()}원</span>
      </div>
    </div>
  );
}

export default Analytics;
