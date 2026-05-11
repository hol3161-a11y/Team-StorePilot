"use client"
import { useState, useEffect } from 'react'
import axios from 'axios'

import sales from '@/app/(pages)/sales/sales.module.scss'
import DateSelectTab from '@/components/sales/DateSelectTab'
import AddSalesPopup from '@/app/(pages)/sales/popup/AddSalesPopup'
import DayWeekMonthTab from '@/components/sales/DayWeekMonthTab'
import Chart from '@/components/sales/Chart'
import Ai from '@/components/sales/Ai'


// 한국 시간(KST, UTC+9) 기준 오늘 날짜 반환
const getKoreaToday = () => {
  const now = new Date()
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 9 * 3600000)
}

// 특정 날짜가 해당 월의 몇 주차인지 계산
const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((firstDay + date.getDate()) / 7);
}

export default function SalesClient() {


  const [salesData, setSalesData] = useState([]);
  const [checkedAll, setCheckedAll] = useState(false);
  const [checked, setChecked] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const today = getKoreaToday()

  /* 탭 전환 시 DateSelectTab의 비활성화 항목 결정 + 매출 필터링 기준 */
  const [activeTab, setActiveTab] = useState('일별');

  /* 탭 전환 시 열려 있던 드롭다운을 닫기 위해 SaleClient.jsx에서 관리 */
  const [openDropdown, setOpenDropdown] = useState(null);

  /* 필터링에 사용하므로 SaleClient.jsx에서 관리 */
  const [selected, setSelected] = useState({
    year: `${today.getFullYear()}년`,
    month: `${today.getMonth() + 1}월`,
    week: `${getWeekOfMonth(today)}주차`,
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setOpenDropdown(null);
  };

  const fetchSales = () => {
    axios.get('/api/sales/db')
      .then(res => {
        setSalesData(res.data.sales);
        setChecked(new Array(res.data.sales.length).fill(false));
      })
      .catch(err => console.error('매출 조회 실패', err));
  };

  useEffect(() => {
    fetchSales();
    window.addEventListener('sales-updated', fetchSales);
    return () => window.removeEventListener('sales-updated', fetchSales);
  }, []);

  const filteredData = salesData.filter(item => {
    const date = new Date(item.date);
    const itemYear = date.getFullYear();
    const itemMonth = date.getMonth() + 1;
    const itemWeek = getWeekOfMonth(date);

    const selYear = parseInt(selected.year);
    const selMonth = parseInt(selected.month);
    const selWeek = parseInt(selected.week);

    if (activeTab === '월별') return itemYear === selYear;
    if (activeTab === '주별') return itemYear === selYear && itemMonth === selMonth;

    return itemYear === selYear && itemMonth === selMonth && itemWeek === selWeek;
  });

  const getCompare = () => {
    switch (activeTab) {
      case '월별': return '작년';
      case '주별': return '지난달';
      case '일별': return '지난주';
    }
  };

  const getCompareItem = (item) => {
    const date = new Date(item.date);
    const compareDate = new Date(date);

    if (activeTab === '일별') {
      compareDate.setDate(date.getDate() - 7);
    } else if (activeTab === '주별') {
      compareDate.setMonth(date.getMonth() - 1);
    } else {
      compareDate.setFullYear(date.getFullYear() - 1);
    }

    const compareDateStr = compareDate.toISOString().slice(0, 10);
    return salesData.find(d => d.date === compareDateStr) ?? null;
  };

  useEffect(() => {
    axios.get('/api/setting')
  }, []);

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

  const handleDelete = async () => {
    const datesToDelete = salesData
      .filter((_, i) => checked[i])
      .map(item => item.date);

    if (datesToDelete.length === 0) return;

    /* 테스트 계정은 매출 삭제 불가 */
    if (account?.id === testAccount) return alert("테스트 계정은 매출을 삭제할 수 없습니다.");

    await axios.delete('/api/sales/db', { params: { dates: datesToDelete.join(',') } });

    const remaining = salesData.filter(item => !datesToDelete.includes(item.date));
    setSalesData(remaining);
    setChecked(new Array(remaining.length).fill(false));
    setCheckedAll(false);
  };

  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return './img/icon/ic-sort-none.svg';
    return sortDir === 'desc' ? './img/icon/ic-sort-down.svg' : './img/icon/ic-sort-up.svg';
  };

  const sortedData = [...filteredData]
    .map(item => {
      const prev = getCompareItem(item);
      const diff = prev ? Number(item.dailySales) - Number(prev.dailySales) : null;
      return { ...item, diff };
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortKey === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (sortKey === 'sales') {
        valA = Number(a.dailySales);
        valB = Number(b.dailySales);
      } else {
        valA = a.diff ?? (sortDir === 'desc' ? -Infinity : Infinity);
        valB = b.diff ?? (sortDir === 'desc' ? -Infinity : Infinity);
      }
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });

  const columns = [
    { key: 'date', label: '날짜' },
    { key: 'sales', label: '매출' },
    { key: 'diff', label: `${getCompare()} 보다` },
  ];

  return (
    <>
      <div className={`${sales.sales} ${popupOpen || editItem ? sales.openPopup : ''}`}>
        <div className={sales.title}>
          <h1><span>매출</span> 관리</h1>
          <DayWeekMonthTab activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>

        <DateSelectTab
          activeTab={activeTab}
          selected={selected}
          setSelected={setSelected}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
        />

        <section className={sales.section}>
          <article className={`${sales.left} ${sales.content}`}>
            <div className={sales.title}>
              <h3>매출 목록</h3>
              <div className={sales.btns}>
                <p onClick={() => setPopupOpen(true)}>
                  <img src="./img/icon/ic-plus(black).svg" alt="추가버튼" />
                </p>
                <p onClick={handleDelete}><img src="./img/icon/ic-bin.svg" alt="삭제버튼" /></p>
              </div>
            </div>

            <div className={sales.graph}>
              <div className={sales.titleLine}>
                <input
                  type="checkbox"
                  className={sales.checkbox}
                  checked={checkedAll}
                  onChange={e => {
                    setCheckedAll(e.target.checked)
                    setChecked(checked.map(() => e.target.checked))
                  }}
                />
                <div className={sales.text}>
                  {columns.map(col => (
                    <div key={col.key} onClick={() => handleSort(col.key)} className={sales.sortTab}>
                      <p>{col.label}</p>
                      <p><img src={getSortIcon(col.key)} alt="정렬아이콘" /></p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={sales.lines}>
                {sortedData.map((item) => {
                  const { diff } = item;
                  const idx = salesData.indexOf(salesData.find(d => d.date === item.date));

                  return (
                    <div key={item.date} className={sales.oneline}>
                      <input
                        type="checkbox"
                        className={sales.checkbox}
                        checked={checked[idx] ?? false}
                        onChange={e => setChecked(prev => prev.map((v, j) => j === idx ? e.target.checked : v))}
                      />

                      <div className={sales.text}>
                        <div className={sales.date}>
                          {item.date.slice(5).replace('-', '.')} ({item.day})
                        </div>

                        <div className={sales.sale}>
                          {Number(item.dailySales).toLocaleString()}
                        </div>

                        <div className={diff === null ? '' : diff >= 0 ? sales.plus : sales.minus}>
                          {diff === null ? '-' : `${diff >= 0 ? '+' : ''}${diff.toLocaleString()}`}
                        </div>
                      </div>

                      <p
                        className={sales.editBtn}
                        onClick={() => setEditItem(item)}
                      >
                        <img src="./img/icon/ic-edit.svg" alt="수정아이콘" />
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>

          <article className={sales.right}>
            <h3 className={sales.title}>매출 그래프</h3>

            <div className={sales.graphs}>
              <div className={sales.graph}>
                <Chart salesData={salesData} activeTab={activeTab} selected={selected} />
              </div>

              <div className={sales.graph}>
                <div className={sales.AItitle}>
                  <p><img src="./img/icon/ic-AI.svg" alt="AI아이콘" /></p>
                  <h3>AI 분석</h3>
                </div>

                <div className={sales.aiText}>
                  {/* <Ai salesData={salesData} /> */}
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      {popupOpen &&
        <AddSalesPopup
          onClose={() => setPopupOpen(false)}
          salesData={salesData}
          today={today}
          onSave={fetchSales}
          activeTab={activeTab}
        />
      }

      {editItem &&
        <AddSalesPopup
          editItem={editItem}
          onClose={() => setEditItem(null)}
          salesData={salesData}
          today={today}
          onSave={fetchSales}
          activeTab={activeTab}
        />
      }
    </>
  )
}
