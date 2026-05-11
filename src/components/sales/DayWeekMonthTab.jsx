import styles from "./DayWeekMonth.module.scss";

// activeTab, setActiveTab을 props로 받아서 page.jsx에서 상태를 통합 관리함
// → DateSelectTab 비활성화 제어 + 매출 필터링을 page.jsx 한 곳에서 처리하기 위함
export default function DayWeekMonthTab({ activeTab, setActiveTab }) {
    return (
        <div className={styles.tab}>
            {['일별', '주별', '월별'].map(tab => (
                <button
                    key={tab}
                    className={activeTab === tab ? styles.active : ''}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    )
}
