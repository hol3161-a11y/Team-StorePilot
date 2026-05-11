import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

import styles from './AddSalesPopup.module.scss';
import period from '@/components/sales/DateSelectTab.module.scss';
import MenuAddForm from '@/components/sales/MenuAddForm';
import MenuRow from '@/components/sales/MenuRow';
import SalesSummary from '@/components/sales/SalesSummary';

export default function AddSalesPopup({ onClose, salesData, today, onSave, activeTab, editItem }) {
  const isEdit = !!editItem;

  const { data: session } = useSession();
  const ownerId = session?.user?.email
    ?? (typeof window !== 'undefined' ? localStorage.getItem('storePilot.email') : null);

  // ─── 메뉴 목록 (API) ────────────────────────────────────────
  const [menuData, setMenuData] = useState([]);




  useEffect(() => {
    axios.get('/api/menu/db')
      .then(res => {
        const menu = res.data.menu;
        console.log(res);

        setMenuData(menu);
        if (isEdit) {
          setAddMenus(
            (editItem?.details ?? []).map(item => {
              const found = menu.find(m => m.name === item.name);
              const price = found ? Number(found.price.toString().replace(/,/g, '')) : 0;
              return { ...item, sales: price * Number(item.count) };
            })
          );
        }
      })
      .catch(err => console.error('메뉴 조회 실패', err));
  }, [ownerId]);

  // ─── 추가된 메뉴 목록 ────────────────────────────────────────
  const [addMenus, setAddMenus] = useState(editItem?.details ?? []);
  const totalSales = addMenus.reduce((sum, item) => sum + Number(item.sales), 0);

  const handleAdd = ({ name, count, sales }) => {
    const existing = addMenus.find(item => item.name === name);
    if (existing) {
      setAddMenus(prev => prev.map(item =>
        item.name === name
          ? { ...item, count: item.count + count, sales: item.sales + sales }
          : item
      ));
    } else {
      setAddMenus(prev => [...prev, { name, count, sales }]);
      setChecked(prev => [...prev, false]);
    }
  };

  const handleEditSubmit = (itemName, data) => {
    setAddMenus(prev => prev.map(item => item.name === itemName ? data : item));
    setEdit(null);
  };

  // ─── 체크박스 ───────────────────────────────────────────────
  const [checkedAll, setCheckedAll] = useState(false);
  const [checked, setChecked] = useState(new Array((editItem?.details ?? []).length).fill(false));


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

  const handleDelete = () => {
    const deleteNames = addMenus.filter((_, i) => checked[i]).map(item => item.name);

    if (deleteNames.length === 0) return;

    /* 테스트 계정은 매출 삭제 불가 */
    if (account?.id === testAccount) return alert("테스트 계정은 매출을 삭제할 수 없습니다.");

    const remaining = addMenus.filter(item => !deleteNames.includes(item.name));
    setAddMenus(remaining);
    setChecked(new Array(remaining.length).fill(false));
    setCheckedAll(false);
  };

  // ─── 인라인 수정 ─────────────────────────────────────────────
  const [edit, setEdit] = useState(null);

  // ─── 날짜 선택 ───────────────────────────────────────────────
  const [selDate, setSelDate] = useState(() => {
    if (editItem) {
      const [y, m, d] = editItem.date.split('-');
      return { year: `${parseInt(y)}년`, month: `${parseInt(m)}월`, date: `${parseInt(d)}일` };
    }
    return {
      year: `${today.getFullYear()}년`,
      month: `${today.getMonth() + 1}월`,
      date: `${today.getDate()}일`,
    };
  });

  const [dateOpenDropdown, setDateOpenDropdown] = useState(null);
  const [addInput, setAddInput] = useState(false);

  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(parseInt(selDate.year), parseInt(selDate.month), 0).getDate();

  const tab = [
    { key: 'year', label: selDate.year },
    { key: 'month', label: selDate.month },
    { key: 'date', label: selDate.date },
  ];

  const options = {
    year: Array.from({ length: currentYear - 1999 }, (_, i) => `${2000 + i}년`).reverse(),
    month: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
    date: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`),
  };

  const dateToggleDropdown = (key) => {
    setDateOpenDropdown(prev => prev === key ? null : key);
  };

  const handleDateSelect = (key, value) => {
    setSelDate(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'year' || key === 'month') {
        const ny = parseInt(key === 'year' ? value : next.year);
        const nm = parseInt(key === 'month' ? value : next.month);
        const days = new Date(ny, nm, 0).getDate();
        if (parseInt(next.date) > days) next.date = `${days}일`;
      }
      return next;
    });
    setDateOpenDropdown(null);
  };

  // ─── 날짜 계산 ───────────────────────────────────────────────
  const year = parseInt(selDate.year);
  const month = parseInt(selDate.month) - 1;
  const date = parseInt(selDate.date);

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const compareLabel = activeTab === '월별' ? '작년' : activeTab === '주별' ? '지난달' : '지난주';

  const prevDate = new Date(year, month, date);
  if (activeTab === '월별') prevDate.setFullYear(year - 1);
  else if (activeTab === '주별') prevDate.setMonth(month - 1);
  else prevDate.setDate(date - 7);

  const prevSales = salesData.find(item => item.date === fmt(prevDate));
  const compareSales = totalSales - (prevSales?.dailySales ?? 0);

  // ─── 정렬 ────────────────────────────────────────────────────
  const columns = [
    { key: 'name', label: '메뉴명' },
    { key: 'count', label: '판매량' },
    { key: 'sales', label: '판매금액' },
  ];

  const [sortKey, setSortKey] = useState('count');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedMenus = [...addMenus].sort((a, b) => {
    const cmp = sortKey === 'name'
      ? a.name.localeCompare(b.name, 'ko')
      : Number(a[sortKey]) - Number(b[sortKey]);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // ─── 저장 ────────────────────────────────────────────────────
  const saveSales = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const day = days[new Date(year, month, date).getDay()];
    const payload = {
      date: fmt(new Date(year, month, date)),
      day,
      dailySales: totalSales,
      details: addMenus,
    };

    const request = isEdit
      ? axios.put('/api/sales/db', payload)
      : axios.post('/api/sales/db', payload);

    request
      .then(() => { onSave(); onClose(); })
      .catch(err => console.error('매출 저장 실패', err));
  };


  const linesRef = useRef(null);


  // ─── JSX ─────────────────────────────────────────────────────
  return (
    <div className={styles.back}>
      <div className={styles.popup}>

        {/* 타이틀 */}
        <div className={styles.title}>
          <div className={styles.titleName}>
            <p><img src="./img/icon/ic-sales-edit.svg" alt="매출상세아이콘" /></p>
            <h3>{isEdit ? '매출 수정' : '매출 추가'}</h3>
          </div>
          <p className={styles.xbtn} onClick={onClose}>
            <img src="./img/icon/ic-x.svg" alt="x버튼" />
          </p>
        </div>

        <div className={styles.inner}>

          {/* 상단: 날짜 선택 + 추가/삭제 버튼 */}
          <div className={styles.graphTop}>
            <div className={styles.searchAndperiod}>
              {isEdit
                ? <p className={styles.editDate}>{editItem.date.replaceAll('-', '.')} ({editItem.day})</p>
                : <div className={`${period.period} ${styles.period}`}>
                  {tab.map(({ key, label }) => (
                    <div key={key} className={period.periodItem}>
                      <button
                        className={`${period.periodBtn} ${dateOpenDropdown === key ? period.periodBtnOpen : ''}`}
                        onClick={() => dateToggleDropdown(key)}
                      >
                        {label}
                        <p><img src="./img/icon/ic-down.svg" alt="펼침아이콘" /></p>
                      </button>

                      {dateOpenDropdown === key && (
                        <ul className={`${period.dropdown} ${styles.dropdown}`}>
                          {options[key].map(opt => (
                            <li
                              key={opt}
                              className={selDate[key] === opt ? period.dropdownActive : ''}
                              onClick={() => handleDateSelect(key, opt)}
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              }
            </div>

            <div className={styles.btns}>
              <p onClick={() => {
                setAddInput(!addInput);
                if (!addInput) linesRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}>

                <img src="./img/icon/ic-plus(black).svg" alt="추가버튼" />
              </p>
              <p onClick={handleDelete}>
                <img src="./img/icon/ic-bin.svg" alt="삭제버튼" />
              </p>
            </div>
          </div>

          {/* 테이블 */}
          <div className={styles.graph}>

            {/* 테이블 헤더 */}
            <div className={styles.titleLine}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checkedAll}
                onChange={e => {
                  setCheckedAll(e.target.checked);
                  setChecked(checked.map(() => e.target.checked));
                }}
              />
              <div className={styles.text}>
                {columns.map(col => (
                  <div key={col.key} onClick={() => handleSort(col.key)} className={styles.sortTab}>
                    <p>{col.label}</p>
                    <p>
                      <img
                        src={
                          sortKey !== col.key ? './img/icon/ic-sort-none.svg'
                            : sortDir === 'asc' ? './img/icon/ic-sort-up.svg'
                              : './img/icon/ic-sort-down.svg'
                        }
                        alt="정렬아이콘"
                      />
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.lines} ref={linesRef}>
              {addInput && <MenuAddForm menuData={menuData} onAdd={handleAdd} />}

              {sortedMenus.map((item) => {
                const idx = addMenus.indexOf(addMenus.find(d => d.name === item.name));
                return (
                  <MenuRow
                    key={item.name}
                    item={item}
                    idx={idx}
                    isEditing={edit === item.name}
                    checked={checked[idx]}
                    onCheckChange={e => setChecked(prev => prev.map((v, j) => j === idx ? e.target.checked : v))}
                    onEditStart={() => setEdit(item.name)}
                    onEditSubmit={(data) => handleEditSubmit(item.name, data)}
                    menuData={menuData}
                  />
                );
              })}
            </div>
          </div>

          {/* 하단: 매출 요약 */}
          <SalesSummary
            totalSales={totalSales}
            compareLabel={compareLabel}
            prevSales={prevSales}
            compareSales={compareSales}
          />

          <button className={styles.saveBtn} onClick={saveSales}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
