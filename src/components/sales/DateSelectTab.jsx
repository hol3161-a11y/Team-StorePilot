import React from 'react'
import styles from "./DateSelectTab.module.scss"

// 특정 년/월의 총 주차 수 계산
const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    return Math.ceil((firstDay + daysInMonth) / 7);
};

// props:
//   activeTab       - '일별' | '주별' | '월별' (DayWeekMonthTab에서 선택한 값)
//   selected        - 현재 선택된 { year, month, week }
//   setSelected     - selected 변경 함수
//   openDropdown    - 현재 열린 드롭다운 키 ('year' | 'month' | 'week' | null)
//   setOpenDropdown - openDropdown 변경 함수 (page.jsx에서 관리해서 탭 전환 시 닫을 수 있게 함)
export default function DateSelectTab({ activeTab, selected, setSelected, openDropdown, setOpenDropdown }) {
    const y = parseInt(selected.year);
    const m = parseInt(selected.month);
    const tab = [
        { key: 'year', label: selected.year },
        { key: 'month', label: selected.month },
        { key: 'week', label: selected.week },
    ];

    // 각 드롭다운의 선택지 목록
    const currentYear = new Date().getFullYear();
    const options = {
        year: Array.from({ length: currentYear - 1999 }, (_, i) => `${2000 + i}년`).reverse(),
        month: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
        // 선택된 년/월 기준으로 실제 주차 수만큼만 생성
        week: Array.from({ length: getWeeksInMonth(y, m) }, (_, i) => `${i + 1}주차`),
    };

    // activeTab에 따라 클릭 자체를 막을 항목 결정
    // - 월별: 월, 주차 비활성화
    // - 주별: 주차만 비활성화
    // - 일별: 모두 활성화
    const disabledKeys =
        activeTab === '월별'
            ? ['month', 'week']
            : activeTab === '주별'
                ? ['week']
                : [];

    // 비활성화된 항목은 드롭다운을 열지 않음
    const toggleDropdown = (key) => {
        if (disabledKeys.includes(key)) return;     // 비활성화 항목을 갖고있다면 return
        setOpenDropdown(prev => prev === key ? null : key);
    };

    const handleSelect = (key, value) => {
        setSelected(prev => {
            const next = { ...prev, [key]: value };
            // 년/월이 바뀌면 주차 수가 달라질 수 있으므로
            // 현재 선택된 주차가 새 달의 최대 주차를 초과하면 마지막 주차로 자동 보정
            if (key === 'year' || key === 'month') {
                const ny = parseInt(key === 'year' ? value : next.year)
                const nm = parseInt(key === 'month' ? value : next.month)
                const maxWeeks = getWeeksInMonth(ny, nm)
                if (parseInt(next.week) > maxWeeks) next.week = `${maxWeeks}주차`
            }
            return next;
        });
        setOpenDropdown(null);
    };

    return (
        <div className={styles.period}>
            {tab.map(({ key, label }) => {
                const isDisabled = disabledKeys.includes(key)
                return (
                    <div key={key} className={styles.periodItem}>
                        <button
                            className={`${styles.periodBtn} ${openDropdown === key ? styles.periodBtnOpen : ''} ${isDisabled ? styles.periodBtnDisabled : ''}`}
                            onClick={() => toggleDropdown(key)}
                        >
                            {label}
                            <p><img src="./img/icon/ic-down.svg" alt="펼침아이콘" /></p>
                        </button>

                        {/* 비활성화된 항목은 드롭다운을 렌더링하지 않음 */}
                        {openDropdown === key && !isDisabled && (
                            <ul className={styles.dropdown}>
                                {options[key].map(opt => (
                                    <li
                                        key={opt}
                                        className={selected[key] === opt ? styles.dropdownActive : ''}
                                        onClick={() => handleSelect(key, opt)}
                                    >
                                        {opt}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
