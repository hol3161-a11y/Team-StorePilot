"use client"
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from './front.module.scss';

export default function Front({ onClose }) {
  const { data: session } = useSession();
  const ownerId = session?.user?.email
    ?? (typeof window !== 'undefined' ? localStorage.getItem('storePilot.email') : null);

  const [menuData, setMenuData] = useState([]);

  const catRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (e) => {
    dragState.current = { isDragging: true, startX: e.clientX, scrollLeft: catRef.current.scrollLeft };
    catRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = (e) => {
    if (!dragState.current.isDragging) return;
    catRef.current.scrollLeft = dragState.current.scrollLeft - (e.clientX - dragState.current.startX);
  };
  const onMouseUp = (e) => {
    dragState.current.isDragging = false;
    catRef.current.style.cursor = 'grab';
  };
  const onClickCapture = (e) => {
    if (Math.abs(e.clientX - dragState.current.startX) > 5) e.stopPropagation();
  };

  useEffect(() => {
    axios.get('/api/menu/db')
      .then(res => setMenuData(res.data.menu))
      .catch(err => console.error('메뉴 조회 실패', err));
  }, [ownerId]);

  /* 카테고리 배열 */
  const categories = [...new Set(menuData.map(item => item.category))];   // new Set() : 중복을 자동으로 제거하는 자료구조
  const [activeTab, setActiveTab] = useState('전체');

  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState({});

  const handleQty = (id, delta) => {
    setQuantities(prev => {
      const next = (prev[id] ?? 0) + delta;
      return { ...prev, [id]: next < 0 ? 0 : next };
    });
  };

  const totalPrice = menuData.reduce((sum, item) => {
    return sum + (quantities[item._id] ?? 0) * Number(item.price);
  }, 0);

  const handleOrder = async () => {
    const details = menuData
      .filter(item => (quantities[item._id] ?? 0) > 0)
      .map(item => ({
        name: item.name,
        count: quantities[item._id],
        sales: quantities[item._id] * Number(item.price),
      }));

    if (details.length === 0) return alert('주문할 메뉴를 선택해주세요.');

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

    await axios.post('/api/sales/db', {
      date,
      day,
      dailySales: totalPrice,
      details,
    });

    setQuantities({});
    window.dispatchEvent(new CustomEvent('sales-updated'));

    alert('매출이 추가 되었습니다.');

    onClose();
  };

  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('desc');

  const columns = [
    { key: 'name', label: '메뉴명' },
    { key: 'status', label: '상태' },
    { key: 'price', label: '가격' },
  ];

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedMenus = [...menuData]
    .filter(item => activeTab === '전체' || item.category === activeTab)    // 카테고리 탭 필터
    .filter(item => item.name.includes(search))                            // 검색 필터
    .sort((a, b) => {                                                      // 정렬
      const statusOrder = { '판매중': 0, '품절': 1 };
      const cmp = sortKey === 'name'
        ? b.name.localeCompare(a.name, 'ko')
        : sortKey === 'status'
          ? statusOrder[a.status] - statusOrder[b.status]
          : Number(a[sortKey]) - Number(b[sortKey]);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className={styles.back} /* onClick={e => e.target === e.currentTarget && onClose()} */>
      <div className={styles.popup}>
        <div className={styles.title}>
          <div className={styles.titleName}>
            <p><img src="./img/icon/ic-sales-detail.svg" alt="QuickOrder 아이콘" /></p>
            <h3>QuickOrder</h3>
          </div>
          <p className={styles.xbtn} onClick={onClose}>
            <img src="./img/icon/ic-x.svg" alt="x버튼" />
          </p>
        </div>

        <div className={styles.inner}>
          <div className={styles.graphTop}>
            <div className={styles.searchAndperiod}>
              <form className={styles.searchBar}>
                <button><img src="./img/icon/ic-search.svg" alt="검색아이콘" /></button>
                <input
                  type="text"
                  placeholder='메뉴명 검색'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </form>

              <div
                className={styles.categories}
                ref={catRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onClickCapture={onClickCapture}
              >
                <button
                  className={`${styles.btn} ${activeTab === '전체' ? styles.active : ''}`}
                  onClick={() => setActiveTab('전체')}
                >
                  전체
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`${styles.btn} ${activeTab === cat ? styles.active : ''}`}
                    onClick={() => setActiveTab(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.graph}>
            <div className={styles.titleLine}>
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

            <div className={styles.lines}>
              {sortedMenus.map((item, i) =>
                <div className={styles.oneline} key={i}>
                  <div className={styles.detail}>
                    <p>{item.name}</p>

                    <p
                      className={item.status === '품절' ? styles.soldout : styles.available}
                    >
                      {item.status}
                    </p>

                    <p>{Number(item.price).toLocaleString()} 원</p>
                  </div>

                  <div className={`${styles.pmBtn} ${item.status === '품절' ? styles.disabled : ''}`}>
                    <p
                      className={styles.btn}
                      onClick={() => item.status !== '품절' && handleQty(item._id, -1)}
                    >
                      <img src={`./img/icon/ic-minus${item.status === '품절' ? '(disabled)' : ''}.svg`} alt="감소버튼" />
                    </p>

                    <p className={styles.quantity}>{quantities[item._id] ?? 0}</p>

                    <p
                      className={styles.btn}
                      onClick={() => item.status !== '품절' && handleQty(item._id, 1)}
                    >
                      <img src={`./img/icon/ic-plus${item.status === '품절' ? '(disabled)' : '(white)'}.svg`} alt="증가버튼" />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.graphBot}>
            <p>총 금액</p>
            <p><img src="./img/icon/ic-right.svg" alt="right" /></p>
            <p>{totalPrice.toLocaleString()} 원</p>
          </div>

          <button
            className={styles.order}
            onClick={handleOrder}
          >
            주문하기
          </button>
        </div>
      </div>
    </div>
  )
}
