
"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import styles from '@/app/(pages)/menu/menu.module.scss'
import axios from 'axios';
import Ai from '@/components/menu/Ai';

function Menu() {

    const { data: session } = useSession();
    const ownerId = session?.user?.email
        ?? (typeof window !== 'undefined' ? localStorage.getItem('storePilot.email') : null);

    const [data, setData] = useState([]);
    const [menuData, setMenuData] = useState([]);
    const [originData, setOriginData] = useState([]); // 원본

    const [checkedAll, setCheckedAll] = useState(false); // 전체 선택 체크박스 상태
    const [checked, setChecked] = useState([]);          // 각 행의 체크박스 상태 배열

    // 수정하기
    const [editingId, setEditingId] = useState(null);
    const [editItem, setEditItem] = useState({});

    // 컬럼 정렬 (오름차순, 내림차순)
    const [sortKey, setSortKey] = useState(''); // 어떤 컬럼인지
    const [sortOrder, setSortOrder] = useState('asc'); // asc | desc

    // 가격 ( , )
    const [priceInput, setPriceInput] = useState(""); // 화면용 (콤마 포함)
    const [priceValue, setPriceValue] = useState(0);  // 실제 숫자

    //검색 상태 추가
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");


    useEffect(() => {
        if (!ownerId) return;
        fetchMenu();
    }, [ownerId]);

    const fetchMenu = async () => {
        try {
            const res = await axios.get('/api/menu/db', {
                params: {
                    ownerId,
                    storeId: '001',
                }
            });

            console.log("응답:", res.data);

            const menu = Array.isArray(res.data?.menu)
                ? res.data.menu
                : [];

            const dataWithCheck = menu.map((item, index) => ({
                ...item,
                checked: false
            }));




            setMenuData(dataWithCheck);
            setData(res.data);
            setOriginData(dataWithCheck); // 원본 저장
        }
        catch (err) { console.error('menu 조회 실패', err) };
    }

    //체크박스 전체
    const handleCheckAll = (checked) => {
        setCheckedAll(checked);

        setMenuData(prev =>
            prev.map(item => ({
                ...item,
                checked
            }))
        );
    };

    //체크박스 개별
    const handleCheckOne = (id, checked) => {
        const newList = menuData.map(item =>
            item._id === id ? { ...item, checked } : item
        );

        setMenuData(newList);
        setCheckedAll(newList.length > 0 && newList.every(i => i.checked === true));
    };

    // 표- 상태 추가 
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        price: "",
        category: "",
        status: ""
    });

    // 메뉴 추가
    const handleAdd = async () => {

        try {
            await axios.post('/api/menu/db', {
                ...newItem,
                ownerId,
                storeId: '001',
                //price: Number(newItem.price)
            });

            await fetchMenu();
        } catch (err) {
            console.error('추가 실패', err);
        }

        setNewItem({
            name: "",
            price: "",
            sales: "",
            status: ""
        });

        setIsAdding(false);
    };

    //드롭다운
    const [openDropdown, setOpenDropdown] = useState(null);

    const categories = [
        "치킨",
        "사이드",
        "분식",
        "탕",
        "음료"
    ];

    const statuses = [
        "판매중",
        "품절"
    ];

    // 판매중|품절 색상 구별
    const getStatusClass = (status) => {
        switch (status) {
            case "판매중":
                return styles.active;
            case "품절":
                return styles.soldout;
            default:
                return "";
        }
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

    // 삭제 함수
    const handleDelete = async () => {
        const selectedIds = menuData
            .filter(item => item.checked)
            .map(item => item._id); //  _id 사용

        if (selectedIds.length === 0) {
            alert("삭제할 항목을 선택하세요");
            return;
        }

        // 삭제 확인
        const isConfirm = confirm(`선택한 ${selectedIds.length}개의 메뉴를 삭제하시겠습니까?`);
        if (!isConfirm) return;

        /* 테스트 계정은 매출 삭제 불가 */
        if (account?.id === testAccount) return alert("테스트 계정은 메뉴를 삭제할 수 없습니다.");

        try {
            await axios.delete('/api/menu/db', {
                data: {
                    ownerId,
                    ids: selectedIds
                }
            });

            await fetchMenu(); // 다시 조회
            setCheckedAll(false);

        } catch (err) {
            console.error("삭제 실패", err);
        }



    };


    // 수정 함수(클릭)
    const handleEditClick = (item) => {
        setEditingId(item._id);
        setEditItem({
            name: item.name || "",
            price: item.price || "",
            category: item.category || "",
            status: item.status || ""
        });
    };

    // 수정 함수(저장)
    const handleEditSave = async (item) => {
        if (!confirm("수정하시겠습니까?")) return;
        // console.log(editItem);
        const copyItem = { ...item };
        delete copyItem.checked;

        const editMenu = [...data.menu].map((obj) => {
            if (obj._id === item._id) {
                obj = { ...copyItem, ...editItem }
            }
            return obj;
        })

        try {
            await axios.put('/api/menu/db', {
                menu: editMenu,
                ownerId,
                price: Number(newItem.price)
            });

            await fetchMenu();
            setEditingId(null);

        } catch (err) {
            console.error("수정 실패", err);
        }
    };

    //정렬 함수
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }

        setMenuData(prev => {
            const sorted = [...prev].sort((a, b) => {

                // 문자열
                if (key === 'name' || key === 'category') {
                    return sortOrder === 'asc'
                        ? String(a[key] || '').localeCompare(String(b[key] || ''))
                        : String(b[key] || '').localeCompare(String(a[key] || ''));
                }

                // 숫자
                const toNumber = (val) => Number(String(val).replace(/,/g, '')) || 0;
                if (sortKey === 'price' || sortKey === 'sales') {
                    return sortOrder === 'asc'
                        ? toNumber(a[sortKey]) - toNumber(b[sortKey])
                        : toNumber(b[sortKey]) - toNumber(a[sortKey]);
                }

                // 상태 (커스텀 정렬)
                if (key === 'status') {
                    const order = { '판매중': 1, '품절': 2 };
                    return sortOrder === 'asc'
                        ? (order[a.status] || 99) - (order[b.status] || 99)
                        : (order[b.status] || 99) - (order[a.status] || 99);
                }

                return 0;
            });

            return sorted;
        });

    };


    // 가격 ( , ) 포맷 함수
    const formatNumber = (val) => {
        if (val === undefined || val === null) return "";
        return Number(val).toLocaleString();
    };

    //추가 (Add) 입력
    const handlePriceChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');

        setNewItem({
            ...newItem,
            price: value // 숫자만 저장
        });
    };

    //수정 (Edit) 입력
    const handleEditPriceChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');

        setEditItem({
            ...editItem,
            price: value
        });
    };

    // 검색 실행 함수
    const handleSearch = () => {
        setSearch(searchInput);
    };

    const normalize = (str) => str.replace(/\s/g, "").toLowerCase().trim();

    const filteredMenu = menuData.filter(item => {
        const name = item.name || "";

        return (
            name.toLowerCase().includes(search.toLowerCase()) ||
            normalize(name).includes(normalize(search))
        );
    });

    const tableRef = useRef(null);

    const handleOpenAdd = () => {
        setIsAdding(true);

        setTimeout(() => {
            tableRef.current?.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }, 100);
    };



    //if (!menuData.length) return <div>로딩중...</div>;

    return (
        <div className={styles.menu}>
            <section>
                <div className={styles.main_title}>
                    <span>메뉴</span> 관리
                </div>

                <div className={styles.searchBox}>
                    <div className={styles.searchtxt}>
                        <div className={styles.search}>
                            <img
                                src='./img/icon/ic-search.svg'
                                onClick={handleSearch}
                                style={{ cursor: "pointer" }}
                            />
                            <input
                                type="text"
                                placeholder="메뉴명 입력"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                            />
                        </div>
                        <div className={styles.text}>
                            <p>*최근 30일 기준</p>
                        </div>
                    </div>

                    <div className={styles.icon}>
                        <div className={styles.btn} onClick={handleOpenAdd}>
                            <img src='./img/icon/ic-plus(black).svg' />
                        </div>
                        <div className={styles.btn} onClick={handleDelete} >
                            <img src='./img/icon/ic-bin.svg' />
                        </div>
                    </div>
                </div>

            </section>

            {/* 표 */}
            <section className={styles.section} ref={tableRef}>
                <div className={styles.graph} >
                    <div className={styles.titleLine}>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={checkedAll}
                            onChange={e => handleCheckAll(e.target.checked)}

                        />


                        <div className={styles.sortTxt} onClick={() => handleSort('name')}>
                            메뉴명
                            <img
                                src={
                                    sortKey === 'name'
                                        ? sortOrder === 'asc'
                                            ? '/img/icon/ic-sort-up.svg'
                                            : '/img/icon/ic-sort-down.svg'
                                        : '/img/icon/ic-sort-none.svg'   //  기본 아이콘
                                }
                            />
                        </div>
                        <div className={styles.sortTxt} onClick={() => handleSort('price')}>
                            판매가
                            <img
                                src={
                                    sortKey === 'price'
                                        ? sortOrder === 'asc'
                                            ? '/img/icon/ic-sort-up.svg'
                                            : '/img/icon/ic-sort-down.svg'
                                        : '/img/icon/ic-sort-none.svg'
                                }
                            />
                        </div>
                        <div className={styles.sortTxt} onClick={() => handleSort('sales')}>
                            최근 판매량
                            <img
                                src={
                                    sortKey === 'sales'
                                        ? sortOrder === 'asc'
                                            ? '/img/icon/ic-sort-up.svg'
                                            : '/img/icon/ic-sort-down.svg'
                                        : '/img/icon/ic-sort-none.svg'
                                }
                            />
                        </div>
                        <div className={styles.sortTxt} onClick={() => handleSort('category')}>
                            카테고리
                            <img
                                src={
                                    sortKey === 'category'
                                        ? sortOrder === 'asc'
                                            ? '/img/icon/ic-sort-up.svg'
                                            : '/img/icon/ic-sort-down.svg'
                                        : '/img/icon/ic-sort-none.svg'
                                }
                            />
                        </div>
                        <div className={styles.sortTxt} onClick={() => handleSort('status')}>
                            현재 상태
                            <img
                                src={
                                    sortKey === 'status'
                                        ? sortOrder === 'asc'
                                            ? '/img/icon/ic-sort-up.svg'
                                            : '/img/icon/ic-sort-down.svg'
                                        : '/img/icon/ic-sort-none.svg'
                                }
                            />
                        </div>

                    </div>

                    {/* 메뉴 추가 */}
                    {isAdding && (
                        <div className={styles.Line}>
                            <input type="checkbox" className={styles.checkbox}

                            />

                            {/* 메뉴명 */}
                            <input
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="메뉴명"
                            />

                            {/* 판매가 */}
                            <input
                                value={formatNumber(newItem.price)}
                                onChange={handlePriceChange}
                                placeholder="가격"
                            />

                            {/* 최근 판매량 */}
                            <p> - </p>

                            {/* 카테고리 */}
                            <div className={styles.dropdown}>
                                <div
                                    className={styles.selected}
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "add-category"
                                                ? null
                                                : "add-category"
                                        )
                                    }
                                >
                                    {newItem.category || "카테고리 선택"}
                                    <span><img src="./img/icon/ic-down.svg" /></span>
                                </div>

                                {openDropdown === "add-category" && (
                                    <ul className={styles.menuList}>
                                        {categories.map((item) => (
                                            <li
                                                key={item}
                                                onClick={() => {
                                                    setNewItem({
                                                        ...newItem,
                                                        category: item
                                                    });

                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>


                            {/* 현재 상태 */}
                            <div className={styles.dropdown}>
                                <div
                                    className={styles.selected}
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "add-status"
                                                ? null
                                                : "add-status"
                                        )
                                    }
                                >
                                    {newItem.status || "상태 선택"}
                                    <span><img src="./img/icon/ic-down.svg" /></span>
                                </div>

                                {openDropdown === "add-status" && (
                                    <ul className={styles.menuList}>
                                        {statuses.map((item) => (
                                            <li
                                                key={item}
                                                onClick={() => {
                                                    setNewItem({
                                                        ...newItem,
                                                        status: item
                                                    });

                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className={styles.AllinputBtn}>
                                <button
                                    onClick={handleAdd}
                                    className={styles.saveBtn}>
                                    저장
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className={styles.cancelBtn}>
                                    취소
                                </button>
                            </div>
                        </div>
                    )}




                    {filteredMenu.length === 0 ? (
                        <p className={styles.searchNone}>검색 결과가 없습니다</p>
                    ) : (
                        filteredMenu.map((item, i) => {
                            const isEditing = editingId === item._id;

                            return (
                                <div className={styles.Line} key={item._id}>
                                    {/* 체크 */}
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={item.checked ?? false}
                                        onChange={(e) => handleCheckOne(item._id, e.target.checked)}
                                    />





                                    <div className={styles.Lines}>
                                        {/* 수정 모드 */}
                                        {isEditing ? (
                                            <>
                                                <input
                                                    value={editItem.name}
                                                    onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                                />

                                                <input
                                                    value={formatNumber(editItem.price)}
                                                    onChange={handleEditPriceChange}
                                                />

                                                <p>-</p>


                                                <div className={styles.dropdown}>
                                                    <div
                                                        className={styles.selected}
                                                        onClick={() =>
                                                            setOpenDropdown(
                                                                openDropdown === `edit-category-${item._id}`
                                                                    ? null
                                                                    : `edit-category-${item._id}`
                                                            )
                                                        }
                                                    >
                                                        {editItem.category || "카테고리 선택"}
                                                        <span><img src="./img/icon/ic-down.svg" /></span>
                                                    </div>

                                                    {openDropdown === `edit-category-${item._id}` && (
                                                        <ul className={styles.menuList}>
                                                            {categories.map((category) => (
                                                                <li
                                                                    key={category}
                                                                    onClick={() => {
                                                                        setEditItem({
                                                                            ...editItem,
                                                                            category
                                                                        });

                                                                        setOpenDropdown(null);
                                                                    }}
                                                                >
                                                                    {category}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                <div className={styles.dropdown}>
                                                    <div
                                                        className={styles.selected}
                                                        onClick={() =>
                                                            setOpenDropdown(
                                                                openDropdown === `edit-status-${item._id}`
                                                                    ? null
                                                                    : `edit-status-${item._id}`
                                                            )
                                                        }
                                                    >
                                                        {editItem.status || "상태 선택"}
                                                        <span><img src="./img/icon/ic-down.svg" /></span>
                                                    </div>

                                                    {openDropdown === `edit-status-${item._id}` && (
                                                        <ul className={styles.menuList}>
                                                            {statuses.map((status) => (
                                                                <li
                                                                    key={status}
                                                                    onClick={() => {
                                                                        setEditItem({
                                                                            ...editItem,
                                                                            status
                                                                        });

                                                                        setOpenDropdown(null);
                                                                    }}
                                                                >
                                                                    {status}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* 저장 / 취소 */}
                                                <div className={styles.AllinputBtn}>
                                                    <button onClick={() => handleEditSave(item, i)} className={styles.saveBtn}>
                                                        수정
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className={styles.cancelBtn}>
                                                        취소
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p data-label="메뉴명">{item.name}</p>
                                                <p data-label="가격">{formatNumber(item.price)}</p>
                                                <p data-label="판매량">{item.sales}</p>
                                                <p data-label="카테고리">{item.category}</p>
                                                <p data-label="상태" className={getStatusClass(item.status)}>{item.status}</p>
                                                <p className={styles.editBtn} onClick={() => handleEditClick(item, i)}  >
                                                    <img src="./img/icon/ic-edit.svg" alt="수정아이콘" />
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );

                        })
                    )}
                </div>
            </section>



            <Ai />




        </div>

    )
}

export default Menu