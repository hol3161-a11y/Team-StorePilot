import styles from '@/app/(pages)/sales/popup/AddSalesPopup.module.scss';

export default function SalesSummary({ totalSales, compareLabel, prevSales, compareSales }) {
  return (
    <div className={styles.graphBot}>
      <div>
        <div className={styles.text}>
          <p>총 매출</p>
          <p><img src="./img/icon/ic-right.svg" alt="right" /></p>
          <p>{Number(totalSales).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <div className={styles.text}>
          <p>{compareLabel} 매출</p>
          <p><img src="./img/icon/ic-right.svg" alt="right" /></p>
          <p className={styles.compare}>
            {prevSales ? Number(prevSales.dailySales).toLocaleString() : '-'}
          </p>
        </div>
      </div>

      <div>
        <div className={styles.text}>
          <p>{compareLabel} 보다</p>
          <p><img src="./img/icon/ic-right.svg" alt="right" /></p>
          <p className={prevSales ? (compareSales >= 0 ? styles.plus : styles.minus) : styles.compare}>
            {prevSales
              ? compareSales >= 0
                ? `+${Number(compareSales).toLocaleString()}`
                : Number(compareSales).toLocaleString()
              : '-'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
