import styles from './ScheduleItem.module.scss';

function ScheduleItem({ emp, index, onSelect, selected }) {

  return (
    <div className={styles.scheduleItem}>

      <input
        type="checkbox"
        className={styles.checkbox}
        checked={selected.includes(index)}
        onChange={() => onSelect(index)}
      />

      <ul className={styles.card}>

        <li className={styles.line}>
          <ul className={styles.scheduleItemContent}>

            <li className={styles.scheduleItemGroup}>

              <ul className={styles.scheduleItemRow1}>
                <li><b>이름</b></li>
                <li><span>{emp.name}</span></li>
                <li><b>파트</b></li>
                <li><span>{emp.part}</span></li>
              </ul>

              <ul className={styles.scheduleItemRow2}>
                <li><b>근무시간</b></li>
                <li><span>{emp.startTime} ~ {emp.endTime}</span></li>
                <li><b>전화번호</b></li>
                <li><span>{emp.phone}</span></li>
              </ul>

            </li>

          </ul>
        </li>

      </ul>
    </div>
  );
}

export default ScheduleItem;