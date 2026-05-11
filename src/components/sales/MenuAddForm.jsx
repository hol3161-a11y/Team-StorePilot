import { useState } from 'react';
import period from '@/components/sales/DateSelectTab.module.scss';
import styles from '@/app/(pages)/sales/popup/AddSalesPopup.module.scss';
import MAF from './MenuAddForm.module.scss'

export default function MenuAddForm({ menuData, onAdd }) {
  const [selected, setSelected] = useState('메뉴 선택');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [salesCount, setSalesCount] = useState('');
  const [salesAmount, setSalesAmount] = useState(0);

  const handleSelect = (name) => {
    setSelected(name);
    setOpenDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selected === '메뉴 선택') { alert('메뉴를 선택해주세요.'); return; }
    if (salesCount == 0) { alert('판매량을 입력해주세요.'); return; }

    onAdd({ name: selected, count: Number(salesCount), sales: salesAmount });

    setSelected('메뉴 선택');
    setSalesCount('');
    setSalesAmount(0);
  };

  return (
    <div className={styles.inputLine}>
      <form className={styles.text} onSubmit={handleSubmit}>
        <div>
          {/* 메뉴 선택 드롭다운 */}
          <div className={`${period.period} ${MAF.period}`}>
            <div className={`${period.periodItem} ${MAF.periodItem}`}>
              <div
                className={`${period.periodBtn} ${MAF.periodBtn} ${openDropdown && MAF.periodBtnOpen}`}
                onClick={() => setOpenDropdown(v => !v)}
              >
                {selected}
                <p><img src="./img/icon/ic-down.svg" alt="펼침아이콘" /></p>
              </div>
              {openDropdown && (
                <ul className={`${period.dropdown} ${MAF.dropdown}`}>
                  {menuData.map((item, i) => (
                    <li
                      key={i}
                      className={selected === item.name ? period.dropdownActive : ''}
                      onClick={() => handleSelect(item.name)}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 판매량 입력 */}
          <div>
            <input
              type="text"
              placeholder="판매량 입력"
              value={salesCount}
              onChange={e => {
                const count = e.target.value;
                const menu = menuData.find(m => m.name === selected);
                setSalesCount(count);
                setSalesAmount(menu ? Number(menu.price.toString().replace(/,/g, '')) * Number(count) : 0);
              }}
            />
          </div>

          {/* 판매금액 (자동 계산) */}
          <div>{Number(salesAmount || 0).toLocaleString()}</div>
        </div>

        <button className={styles.addBtn}>
          <img src="./img/icon/ic-plus(white).svg" alt="추가버튼" />
        </button>
      </form>
    </div>
  );
}
