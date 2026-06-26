"use client";

import styles from "../../app/(pages)/schedule/schedule.module.scss";
import ScheduleItem from "./ScheduleItem";
import Analytics from "./Analytics";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

function Schedule() {
  const { data: session } = useSession();
  const ownerId =
    session?.user?.email ??
    (typeof window !== "undefined"
      ? localStorage.getItem("storePilot.email")
      : null);

  const [employees, setEmployees] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState([]);

  // 직원 가져오기
  useEffect(() => {
    if (!ownerId) return;
    const getEmployee = async () => {
      const res = await axios.get("/api/employee/db", {
        params: {
          ownerId,
          storeId: "001",
        },
      });
      setEmployees(res.data.employees);

    };

    getEmployee();
  }, [ownerId]);

  // 현재 주인지 체크
  const isCurrentWeek = () => {
    const today = new Date();

    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    return getMonday(today).getTime() === getMonday(currentDate).getTime();
  };

  //체크 선택
  const handleSelect = (index) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((v) => v !== index) : [...prev, index],
    );
  };

  /* 테스트 계정은 매출 삭제 불가 */
  const [account, setAccount] = useState({});
  const testAccount = 'qwe@email.com';
  useEffect(() => {
    axios.get("/api/setting")
      .then(res => setAccount(res.data.account))
      .catch(err => {
        console.error("계정 정보 조회 실패", err);
      });
  }, []);


  // DELETE 선택
  const handleDeleteSelected = async () => {
    const deleteData = employees.filter((_, i) => {
      return !selected.includes(i);
    });

    /* 테스트 계정은 매출 삭제 불가 */
    if (account?.id === testAccount) return alert("테스트 계정은 근무표 정보를 삭제할 수 없습니다.");

    await fetch("/api/employee/db", {
      method: "put",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId,
        employees: deleteData,
      }),
    });

    setEmployees(deleteData);
    setSelected([]);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  // 수정
  const handleUpdate = async (_id, updatedData) => {
    const editData = sortedEmployees.map((obj, i) => {
      if (i === _id) {
        obj = updatedData;
      }
      return obj;
    });

    const res = await fetch("/api/employee/db", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, employees: editData, type: "update" }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("수정 실패");
      return;
    }

    setEmployees(editData);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  // 오늘 요일 자동 선택
  useEffect(() => {
    const today = new Date();
    const dayMap = ["일", "월", "화", "수", "목", "금", "토"];
    setSelectedDay(dayMap[today.getDay()]);
  }, []);

  // 이전 주 이동
  const goPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // 앞으로 주차 이동
  const goNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // 주차 계산
  const getWeekOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeek = firstDay.getDay();

    return Math.ceil((date.getDate() + firstDayWeek) / 7);
  };

  // 주간 날짜
  const getWeekDates = () => {
    const date = new Date(currentDate);
    const day = date.getDay();

    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  // 날짜 포맷
  const formatDate = (date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 직원 필터
  const filteredEmployees = employees.filter((emp) => {
    if (!emp.days) return false;

    return emp.days.includes(selectedDay);
  });

  console.log(filteredEmployees);

  return (
    <section className={styles.schedule}>
      <div className={styles.container}>
        <div className={styles.scheduleMain}>
          {/* 헤더 */}
          <div className={styles.scheduleHeader}>
            <h2>
              <span className={styles.scheduleTitle}>근무표</span> 관리
            </h2>
            <div className={styles.total}>
              <img src="./img/icon/ic_schedul-person.svg" />
              <p>Total : {employees.length}명</p>
            </div>
          </div>

          <div className={styles.schedulePanel}>
            {/* 주차 + 날짜 */}
            <div className={styles.scheduleNav}>
              <div className={styles.scheduleNavArrow}>
                <img
                  className={styles.btnleft}
                  src="./img/icon/ic-schedul-left.svg"
                  onClick={goPrevWeek}
                />

                <b>
                  {currentDate.getMonth() + 1}월 {getWeekOfMonth(currentDate)}
                  주차
                </b>

                {/* 👉 현재 주 아닐 때만 보여줌 */}
                {!isCurrentWeek() && (
                  <img
                    className={styles.btnright}
                    src="./img/icon/ic-schedul-right.svg"
                    onClick={goNextWeek}
                  />
                )}
              </div>

              {/* <div className={styles.scheduleNavDate}>
                <img src='./img/icon/ic_schedul-calendar.svg' />
                <p>
                  {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                </p>
              </div> */}
            </div>

            {/* 요일 */}
            <div className={styles.scheduleWeek}>
              {["월", "화", "수", "목", "금", "토", "일"].map((day, i) => {
                const date = weekDates[i];

                return (
                  <p
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      ${selectedDay === day ? styles.active : ""}
                 
                    `}
                  >
                    {day}
                  </p>
                );
              })}
            </div>

            {/* 리스트 */}
            <div className={styles.scheduleList}>
              <div className={styles.scheduleDayHeader}>
                <div className={styles.scheduleDay}>
                  <b>{selectedDay}요일</b>
                  <p>
                    {weekDates[
                      ["월", "화", "수", "목", "금", "토", "일"].indexOf(
                        selectedDay,
                      )
                    ]?.getDate()}
                    일
                  </p>
                </div>
                <img
                  src="./img/icon/ic_schedule-bin.svg"
                  onClick={handleDeleteSelected}
                />
              </div>
              {/* 👉 해당 요일에 직원 없을 때 */}
              {filteredEmployees.length === 0 && (
                <p className={styles.empty}>근무하는 직원이 없어요</p>
              )}

              {filteredEmployees.map((emp) => {
                const originalIndex = employees.indexOf(emp);

                return (
                  <ScheduleItem
                    key={originalIndex}
                    emp={emp}
                    index={originalIndex}
                    onSelect={handleSelect}
                    selected={selected}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <Analytics employees={filteredEmployees} />
      </div>
    </section>
  );
}

export default Schedule;
