"use client"
import { useState, useEffect } from 'react'
import axios from 'axios'
import React from 'react'
import style from '@/app/(pages)/dashboard/dashboard.module.scss'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Chart from '@/components/sales/Chart'
import useAIStore from '@/store/aiStore'
import {
  getTodayWorkingEmployees,
  getTodayLaborCost
} from '@/lib/utils/employeeCalc'

const getKoreaToday = () => {
  const now = new Date()
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 9 * 3600000)
}

const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return Math.ceil((firstDay + date.getDate()) / 7)
}


function Dashboard() {
  const { data: session } = useSession();
  const ownerId = session?.user?.email
    ?? (typeof window !== 'undefined' ? localStorage.getItem('storePilot.email') : null);

  const [salesData, setSalesData] = useState([])
  const [employees, setEmployees] = useState([])

  const today = getKoreaToday()

  const todayWorkingEmployees = getTodayWorkingEmployees(employees, today)
  const todayLaborCost = getTodayLaborCost(employees, today)

  const hallCount = todayWorkingEmployees.filter(
    employee => employee.part === '홀'
  ).length

  const kitchenCount = todayWorkingEmployees.filter(
    employee => employee.part === '주방'
  ).length

  const managerCount = todayWorkingEmployees.filter(
    employee => employee.part === '매니저'
  ).length


  const selected = {
    year: `${today.getFullYear()}년`,
    month: `${today.getMonth() + 1}월`,
    week: `${getWeekOfMonth(today)}주차`,
  }

  useEffect(() => {
    if (!ownerId) return;
    axios.get('/api/sales/db', {
      params: { ownerId, storeId: '001' }
    })
      .then(res => setSalesData(res.data.sales))
      .catch(err => console.error('매출 조회 실패', err))
  }, [ownerId])

  useEffect(() => {
    axios.get('/api/employee/db', {
      params: {
        ownerId: ownerId
      }
    })
      .then(res => {
        setEmployees(res.data.employees || [])
      })
      .catch(err => console.error('직원 조회 실패', err))
  }, [])

  /* 예상 매출액 - store에서 읽기 */
  const { sales } = useAIStore();

  function getTodayFormatted() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const week = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = week[date.getDay()];

    return `${year}.${month}.${day} (${weekday})`;
  }
  return (
    <div className={style.dashboard}>
      <section className={style.inner}>

        <div className={style.top}>
          <h1>대시보드</h1>

          <div className={style.dateWrap}>
            <p>{getTodayFormatted()}</p>
          </div>
        </div>

        <Link href="/main" className={style.backBtn}>
          <img src="/img/icon/ic-dashboard-backBtn.png" alt="이전으로" />
        </Link>

        <div className={style.cardWrap}>

          <Link href="/sales" className={style.summaryCard}>
            <div className={style.summaryInner}>
              <p><img src='/img/icon/ic-main-sales.png' /></p>
              <div className={style.summaryText}>
                <p>예상 매출</p>
                <strong>{sales?.predictedAmount?.toLocaleString() ?? '-'} 원</strong>
              </div>
            </div>
          </Link>

          <Link href="/schedule" className={style.summaryCard}>
            <div className={style.summaryInner}>
              <p><img src='/img/icon/ic-main-staff.png' /></p>
              <div className={style.summaryText}>
                <p>예상 인건비</p>
                <strong>{todayLaborCost.toLocaleString()}원</strong>
              </div>
            </div>
          </Link>

          <Link href="#" className={`${style.summaryCard} ${style.caution}`}>
            <div className={`${style.summaryInner} ${style.caution}`}>
              <p><img src='/img/icon/ic-dashboard-stock.png' /></p>
              <div className={style.summaryText}>
                <p>부족 재고</p>
                <strong>2개</strong>
              </div>
            </div>
          </Link>

          <Link href="#" className={`${style.summaryCard} ${style.danger}`}>
            <div className={`${style.summaryInner} ${style.danger}`}>
              <p><img src='/img/icon/ic-dashboard-danger.png' /></p>
              <div className={style.summaryText}>
                <p>폐기 위험</p>
                <strong>1개</strong>
              </div>
            </div>
          </Link>

        </div>

        <section className={style.chartSection}>
          <h2>이번주 매출 그래프</h2>

          <div className={style.chartBox}>
            <Chart salesData={salesData} activeTab="일별" selected={selected} />
          </div>

        </section>

        <section className={style.infoList}>
          <article className={style.infoCard}>
            <Link href="/schedule">
              <div className={style.cardTitle}>
                <h3>오늘 근무 인원</h3>
                <span><img src="/img/icon/ic-dashboard-right-arrow.png" /></span>
              </div>

              <ul>
                {hallCount > 0 && <li>홀 {hallCount}명</li>}
                {kitchenCount > 0 && <li>주방 {kitchenCount}명</li>}
                {managerCount > 0 && <li>매니저 {managerCount}명</li>}
                <li>현재 배정 {todayWorkingEmployees.length}명</li>
              </ul>
            </Link>
          </article>

          <article className={style.infoCard}>
            <Link href="#">
              <div className={style.cardTitle}>
                <h3>발주 추천</h3>
                <span><img src="/img/icon/ic-dashboard-right-arrow.png" /></span>
              </div>

              <ul>
                <li>닭 20마리</li>
                <li>무 2개</li>
              </ul>
            </Link>
          </article>

          <article className={style.infoCard}>
            <Link href="#">
              <div className={style.cardTitle}>
                <h3>폐기 위험 품목</h3>
                <span><img src="/img/icon/ic-dashboard-right-arrow.png" /></span>
              </div>

              <ul>
                <li>양배추 1개</li>
                <li>마요네즈 1개</li>
              </ul>
            </Link>

          </article>
        </section>


        {/* <section className={style.aiBox}>
          <div className={style.aiTitle}>
            <img src="/img/icon/ic-AI.svg" alt="아이콘" />
            <h2>
              AI 운영 브리핑
            </h2>
          </div>
          <div className={style.aiContent}>
            <p>오늘 저녁 인력 배치가 가능합니다</p>
            <p>치킨, 콜라 재고 주의</p>
          </div>
        </section> */}

      </section>
    </div>
  )
}

export default Dashboard
