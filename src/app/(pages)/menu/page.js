
"use client"
import React, { useEffect, useState } from 'react'
import styles from './menu.module.scss'
import axios from 'axios';
import Ai from '@/components/menu/Ai';

function Menu() {

    const [data, setData] = useState([]);
    const [menuData, setMenuData] = useState([]);
    const [originData, setOriginData] = useState([]); // 원본

    const [checkedAll, setCheckedAll] = useState(false); // 전체 선택 체크박스 상태
    const [checked, setChecked] = useState([]);          // 각 행의 체크박스 상태 배열

    // 수정하기
    const [editingId, setEditingId] = useState(null);
    const [editItem, setEditItem] = useState({});

    const session = { email: 'qwe@email.com' };

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
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await axios.get('/api/menu/db', {
                params: {
                    ownerId: session.email, // 추후 세션값으로 교체
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
                ownerId: 'qwe@email.com',
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

        try {
            await axios.delete('/api/menu/db', {
                data: {
                    ownerId: session.email,
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
                ownerId: session.email,
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
                        <div className={styles.btn} onClick={() => setIsAdding(true)}>
                            <img src='./img/icon/ic-plus(black).svg' />
                        </div>
                        <div className={styles.btn} onClick={handleDelete} >
                            <img src='./img/icon/ic-bin.svg' />
                        </div>
                    </div>
                </div>

            </section>

            {/* 표 */}
            <section className={styles.section}>
                <div className={styles.graph}>
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
                            <select
                                value={newItem.category}
                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                            >
                                <option value="">카테고리 선택</option>
                                <option value="치킨">치킨</option>
                                <option value="사이드">사이드</option>
                                <option value="분식">분식</option>
                                <option value="탕">탕</option>
                                <option value="음료">음료</option>
                            </select>

                            {/* 현재 상태 */}
                            <select
                                value={newItem.status}
                                onChange={e => setNewItem({ ...newItem, status: e.target.value })}
                            >
                                <option value="">상태 선택</option>
                                <option value="판매중">판매중</option>
                                <option value="품절">품절</option>
                            </select>

                            <div className={styles.AllinputBtn}>
                                <button
                                    onClick={handleAdd}
                                    className={styles.inputBtn}>
                                    저장
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className={styles.inputBtn}>
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


                                                <select
                                                    value={editItem.category}
                                                    onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                                                >
                                                    <option value="">카테고리 선택</option>
                                                    <option value="치킨">치킨</option>
                                                    <option value="사이드">사이드</option>
                                                    <option value="분식">분식</option>
                                                    <option value="탕">탕</option>
                                                    <option value="음료">음료</option>
                                                </select>

                                                <select
                                                    value={editItem.status}
                                                    onChange={e => setEditItem({ ...editItem, status: e.target.value })}
                                                >
                                                    <option value="판매중">판매중</option>
                                                    <option value="품절">품절</option>
                                                </select>

                                                {/* 저장 / 취소 */}
                                                <div className={styles.AllinputBtn}>
                                                    <button onClick={() => handleEditSave(item, i)} className={styles.inputBtn}>
                                                        수정
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className={styles.inputBtn}>
                                                        취소
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p>{item.name}</p>
                                                <p>{formatNumber(item.price)}</p>
                                                <p>{item.sales }</p>
                                                <p>{item.category}</p>
                                                <p className={getStatusClass(item.status)}>{item.status}</p>
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