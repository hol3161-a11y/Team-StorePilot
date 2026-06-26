"use client"
import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './StockClient.module.scss'

export default function StockClient() {
    const [activeTab, setActiveTab] = useState('');
    const [checkedAll, setCheckedAll] = useState(false);
    const [checked, setChecked] = useState([]);
    const [stocksData, setStocksData] = useState([]);
    const [addInput, setAddInput] = useState(false);
    const [addStock, setAddStock] = useState([]);
    const [selected, setSelected] = useState('상태 선택');
    const [openDropdown, setOpenDropdown] = useState(false);

    const filterTab = ["전체", "부족 예상", "페기주의", "정상"];
    const columns = [
        { key: 'name', label: '품목명' },
        { key: 'quantity', label: '남은 수량' },
        { key: 'expirationDate', label: '유통기한' },
        { key: 'status', label: '현재 상태' },
    ];

    const [sortKey, setSortKey] = useState('date');
    const [sortDir, setSortDir] = useState('desc');

    const getStatus = (expirationDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(expirationDate);
        expDate.setHours(0, 0, 0, 0);
        const diff = Math.round((expDate - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return '폐기주의';
        if (diff <= 1) return '부족예상';
        return '정상';
    };

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

    useEffect(() => {
        axios.get('/api/stock/db')
            .then(res => {
                setStocksData(res.data.stocks);
                setChecked(new Array(res.data.stocks.length).fill(false));
            })
            .catch(err => console.error('재고 조회 실패', err));
    }, []);

    const handleDelete = () => {
        const deleteNames = addStock.filter((_, i) => checked[i]).map(item => item.name);
        if (deleteNames.length === 0) return;
        const remaining = addStock.filter(item => !deleteNames.includes(item.name));
        setAddStock(remaining);
        setChecked(new Array(remaining.length).fill(false));
        setCheckedAll(false);
    };

    const status = ["정상", "폐기주의", "부족예상"];

    const handleSelect = (name) => {
        setSelected(name);
        setOpenDropdown(false);
    };


    return (
        <div className={styles.stock}>
            <h1><span>재고</span> 관리</h1>

            <section>
                <div className={styles.graphTop}>
                    <div className={styles.searchAndTab}>
                        <div className={styles.searchBar}>
                            <button><img src="./img/icon/ic-search.svg" alt="검색아이콘" /></button>

                            <input
                                type="text"
                                placeholder='품목명을 입력해주세요.'
                            />
                        </div>

                        <div className={styles.filterTab}>
                            {filterTab.map((item, i) => (
                                <p
                                    key={i}
                                    className={`${styles.tab} ${activeTab === item ? styles.active : ''}`}
                                    onClick={() => setActiveTab(item)}
                                >
                                    {item}
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className={styles.btns}>
                        <p onClick={() => setAddInput(!addInput)}>
                            <img src="./img/icon/ic-plus(black).svg" alt="추가버튼" />
                        </p>
                        <p onClick={handleDelete}>
                            <img src="./img/icon/ic-bin.svg" alt="삭제버튼" />
                        </p>
                    </div>
                </div>

                <div className={styles.graph}>
                    <div className={styles.titleLine}>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={checkedAll}
                            onChange={e => {
                                setCheckedAll(e.target.checked)
                                setChecked(checked.map(() => e.target.checked))
                            }}
                        />

                        <div className={styles.text}>
                            {columns.map(col => (
                                <div key={col.key} onClick={() => handleSort(col.key)} className={styles.sortTab}>
                                    <p>{col.label}</p>
                                    <p><img src={getSortIcon(col.key)} alt="정렬아이콘" /></p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.lines}>
                        {addInput &&
                            <div className={styles.inputLine}>
                                <form className={styles.text}>
                                    <div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder='품목명 입력'
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                placeholder='남은 수량 입력'
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                placeholder='유통기한 입력'
                                            />
                                        </div>

                                        {/* 상태 선택 드롭다운 */}
                                        <div className={`${styles.period} ${styles.period}`}>
                                            <div className={`${styles.periodItem}`}>
                                                <div
                                                    className={`${styles.periodBtn} ${openDropdown && styles.periodBtnOpen}`}
                                                    onClick={() => setOpenDropdown(v => !v)}
                                                >
                                                    {selected}
                                                    <p><img src="./img/icon/ic-down.svg" alt="펼침아이콘" /></p>
                                                </div>
                                                {openDropdown && (
                                                    <ul className={`${styles.dropdown} ${styles.dropdown}`}>
                                                        {status.map((item, i) => (
                                                            <li
                                                                key={i}
                                                                className={selected === item ? styles.dropdownActive : ''}
                                                                onClick={() => handleSelect(item)}
                                                            >
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button className={styles.addBtn}>
                                        <img src="./img/icon/ic-plus(white).svg" alt="추가버튼" />
                                    </button>
                                </form>
                            </div>
                        }

                        {stocksData.map((item, i) => {
                            const { diff } = item;
                            const idx = addStock.indexOf(addStock.find(d => d.name === item.name));

                            return (
                                <div key={i} className={styles.oneline}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={checked[idx] ?? false}
                                        onChange={e => setChecked(prev => prev.map((v, j) => j === idx ? e.target.checked : v))}
                                    />

                                    <div className={styles.text}>
                                        <div className={styles.name}>
                                            <p
                                                className={`
                                                    ${getStatus(item.expirationDate) === '정상' ? styles.greenDot : ''}
                                                    ${getStatus(item.expirationDate) === '부족예상' ? styles.yellowDot : ''}
                                                    ${getStatus(item.expirationDate) === '폐기주의' ? styles.redDot : ''}
                                                `}
                                            ></p>
                                            {item.name}
                                        </div>

                                        <div className={styles.quantity}>
                                            {item.quantity}
                                        </div>

                                        <div
                                            className={`
                                                ${styles.expirationDate}
                                                ${getStatus(item.expirationDate) === '정상' ? styles.greenDate : ''}
                                                ${getStatus(item.expirationDate) === '부족예상' ? styles.yellowDate : ''}
                                                ${getStatus(item.expirationDate) === '폐기주의' ? styles.redDate : ''}
                                            `}
                                        >
                                            {item.expirationDate}
                                        </div>

                                        <div>
                                            <p
                                                className={`
                                                    ${styles.status} 
                                                    ${getStatus(item.expirationDate) === '정상' ? styles.green : ''}
                                                    ${getStatus(item.expirationDate) === '부족예상' ? styles.yellow : ''}
                                                    ${getStatus(item.expirationDate) === '폐기주의' ? styles.red : ''}
                                                `}
                                            >
                                                {getStatus(item.expirationDate)}
                                            </p>
                                        </div>
                                    </div>

                                    <p
                                        className={styles.editBtn}
                                        onClick={() => setEditItem(item)}
                                    >
                                        <img src="./img/icon/ic-edit.svg" alt="수정아이콘" />
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
