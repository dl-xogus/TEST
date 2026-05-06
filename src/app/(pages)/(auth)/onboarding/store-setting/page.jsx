'use client';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './storeSetting.module.scss';

const TABS = [
  { key: 'menu', label: '메뉴', icon: '/img/icon/menu.svg' },
  { key: 'stock', label: '재고', icon: '/img/icon/inventory.svg' },
  { key: 'staff', label: '직원', icon: '/img/icon/staff.svg' },
];

const INDUSTRIES = {
  restaurant: { label: '요식업', icon: '/img/icon/ic-restaurant.svg' },
  cafe: { label: '카페', icon: '/img/icon/ic-cafe.svg' },
  other: { label: '기타', icon: '/img/icon/ic-dots.svg' },
};

const CATEGORIES = {
  restaurant: ['메인', '사이드', '음료', '세트', '디저트', '기타'],
  cafe: ['커피', '논커피', '브런치', '세트', '디저트', '기타'],
  other: ['상품', '서비스', '기타'],
};

// TODO: LLM 연동 후 이 값을 실제 추천으로 교체
const AI_RECOMMENDED_CATEGORY = '디저트';

const PARTS = ['홀', '주방', '배달', '카운터', '기타'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const TIME_OPTIONS = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const ampm = h < 12 ? '오전' : '오후';
      let displayHour = h % 12;
      if (displayHour === 0) displayHour = 12;
      const minStr = m === 0 ? '00' : '30';
      options.push({
        value: `${String(h).padStart(2, '0')}:${minStr}`,
        label: `${ampm} ${displayHour}:${minStr}`,
      });
    }
  }
  return options;
})();

const Page = () => {
  const router = useRouter();
  const [tab, setTab] = useState('menu');
  const tabsRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const [isAddingStock, setIsAddingStock] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [industry, setIndustry] = useState('restaurant');
  const [customIndustry, setCustomIndustry] = useState('');

  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuName, setMenuName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryDraft, setCustomCategoryDraft] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffItems, setStaffItems] = useState([]);
  const [staffName, setStaffName] = useState('');
  const [staffAge, setStaffAge] = useState('');
  const [staffParts, setStaffParts] = useState([]);
  const [staffDays, setStaffDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [phone, setPhone] = useState('');
  const [openTimeDropdown, setOpenTimeDropdown] = useState(null); // 'start' | 'end' | null
  const timeDropdownRef = useRef(null);

  const [stockErrors, setStockErrors] = useState({});
  const [menuErrors, setMenuErrors] = useState({});
  const [staffErrors, setStaffErrors] = useState({});

  const stockProductNameRef = useRef(null);
  const stockQuantityRef = useRef(null);
  const stockExpirationRef = useRef(null);

  const menuNameRef = useRef(null);
  const menuPriceRef = useRef(null);
  const menuCategoryRef = useRef(null);
  const menuCustomCategoryRef = useRef(null);

  const staffNameRef = useRef(null);
  const staffAgeRef = useRef(null);
  const staffPartsRef = useRef(null);
  const staffDaysRef = useRef(null);
  const staffStartTimeRef = useRef(null);
  const staffEndTimeRef = useRef(null);
  const staffHourlyWageRef = useRef(null);

  const clearError = (setter, key) => {
    setter((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const industryKey = INDUSTRIES[industry] ? industry : 'restaurant';
  const industryLabel = industry === 'other' && customIndustry
    ? customIndustry
    : INDUSTRIES[industryKey].label;
  const industryIcon = INDUSTRIES[industryKey].icon;
  const categoryOptions = CATEGORIES[industryKey];
  const showAiBadge = categoryOptions.includes(AI_RECOMMENDED_CATEGORY) && category !== AI_RECOMMENDED_CATEGORY;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('storePilot.industry');
    if (stored && INDUSTRIES[stored]) setIndustry(stored);
    const storedCustom = localStorage.getItem('storePilot.customIndustry');
    if (storedCustom) setCustomIndustry(storedCustom);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setOpenTimeDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExpirationChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    const yyyy = raw.slice(0, 4);
    let rest = raw.slice(4);

    let mm = '';
    if (rest.length > 0) {
      if (rest.length === 1 && parseInt(rest[0], 10) > 1) {
        mm = '0' + rest[0];
        rest = rest.slice(1);
      } else if (rest.length >= 2) {
        let m = parseInt(rest.slice(0, 2), 10);
        if (m === 0) m = 1;
        if (m > 12) m = 12;
        mm = String(m).padStart(2, '0');
        rest = rest.slice(2);
      } else {
        mm = rest;
        rest = '';
      }
    }

    let dd = '';
    if (rest.length > 0 && mm.length === 2) {
      let maxDay = 31;
      if (yyyy.length === 4) {
        maxDay = new Date(parseInt(yyyy, 10), parseInt(mm, 10), 0).getDate();
      }

      if (rest.length === 1 && parseInt(rest[0], 10) > 3) {
        dd = '0' + rest[0];
      } else if (rest.length >= 2) {
        let d = parseInt(rest.slice(0, 2), 10);
        if (d === 0) d = 1;
        if (d > maxDay) d = maxDay;
        dd = String(d).padStart(2, '0');
      } else {
        dd = rest;
      }
    }

    let formatted = yyyy;
    if (mm) formatted += ` - ${mm}`;
    if (dd) formatted += ` - ${dd}`;
    setExpirationDate(formatted);
    clearError(setStockErrors, 'expirationDate');
  };

  const handleAddStock = () => {
    const errors = {};
    if (productName.trim() === '') errors.productName = '상품명을 입력해주세요.';
    if (quantity.trim() === '') errors.quantity = '수량을 입력해주세요.';
    if (expirationDate.trim() === '') errors.expirationDate = '유통기한을 입력해주세요.';

    if (Object.keys(errors).length > 0) {
      setStockErrors(errors);
      if (errors.productName) stockProductNameRef.current?.focus();
      else if (errors.quantity) stockQuantityRef.current?.focus();
      else if (errors.expirationDate) stockExpirationRef.current?.focus();
      return;
    }

    setStockErrors({});
    setStockItems((prev) => [...prev, { productName, quantity, expirationDate }]);
    setProductName('');
    setQuantity('');
    setExpirationDate('');
    setIsAddingStock(false);
  };

  const handleDeleteStock = (index) => {
    setStockItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePriceChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPrice(digits);
    clearError(setMenuErrors, 'price');
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setDropdownOpen(false);
    setIsAddingCustomCategory(false);
    clearError(setMenuErrors, 'category');
  };

  const handleStartCustomCategory = () => {
    setDropdownOpen(false);
    setIsAddingCustomCategory(true);
    setCustomCategoryDraft('');
    clearError(setMenuErrors, 'category');
  };

  const handleConfirmCustomCategory = () => {
    const trimmed = customCategoryDraft.trim();
    if (trimmed === '') {
      setIsAddingCustomCategory(false);
      return;
    }
    setCategory(trimmed);
    setIsAddingCustomCategory(false);
    clearError(setMenuErrors, 'category');
  };

  const handleApplyAiCategory = () => {
    setCategory(AI_RECOMMENDED_CATEGORY);
    setIsAddingCustomCategory(false);
    clearError(setMenuErrors, 'category');
  };

  const handleAddMenu = () => {
    const errors = {};
    if (menuName.trim() === '') errors.menuName = '메뉴명을 입력해주세요.';
    if (price.trim() === '') errors.price = '가격을 입력해주세요.';
    if (category.trim() === '') errors.category = '카테고리를 선택해주세요.';

    if (Object.keys(errors).length > 0) {
      setMenuErrors(errors);
      if (errors.menuName) menuNameRef.current?.focus();
      else if (errors.price) menuPriceRef.current?.focus();
      else if (errors.category) {
        if (isAddingCustomCategory) menuCustomCategoryRef.current?.focus();
        else menuCategoryRef.current?.focus();
      }
      return;
    }

    setMenuErrors({});
    setMenuItems((prev) => [...prev, { menuName, price, category }]);
    setMenuName('');
    setPrice('');
    setCategory('');
    setIsAddingCustomCategory(false);
    setCustomCategoryDraft('');
    setIsAddingMenu(false);
  };

  const handleDeleteMenu = (index) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  };

  const formatPrice = (p) => {
    if (!p) return '';
    return Number(p).toLocaleString('ko-KR');
  };

  const formatHourlyWage = (val) => {
    if (!val) return '';
    return Number(val).toLocaleString('ko-KR') + '원';
  };

  const handleHourlyWageChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setHourlyWage(digits);
    clearError(setStaffErrors, 'hourlyWage');
  };

  const handleHourlyWageKeyDown = (e) => {
    if (e.key !== 'Backspace') return;
    const input = e.target;
    if (input.selectionStart !== input.selectionEnd) return;
    if (input.selectionStart === input.value.length && hourlyWage) {
      e.preventDefault();
      setHourlyWage(hourlyWage.slice(0, -1));
      clearError(setStaffErrors, 'hourlyWage');
    }
  };

  const formatPhone = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const togglePart = (part) => {
    setStaffParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
    clearError(setStaffErrors, 'staffParts');
  };

  const toggleDay = (day) => {
    setStaffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    clearError(setStaffErrors, 'staffDays');
  };

  const formatTimeLabel = (value) => {
    const opt = TIME_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : '';
  };

  const handleSelectTime = (which, value) => {
    if (which === 'start') {
      setStartTime(value);
      clearError(setStaffErrors, 'startTime');
    } else {
      setEndTime(value);
      clearError(setStaffErrors, 'endTime');
    }
    setOpenTimeDropdown(null);
  };

  const handleAddStaff = () => {
    const errors = {};
    if (staffName.trim() === '') errors.staffName = '이름을 입력해주세요.';
    if (staffAge.trim() === '') errors.staffAge = '나이를 입력해주세요.';
    if (staffParts.length === 0) errors.staffParts = '근무 파트를 선택해주세요.';
    if (staffDays.length === 0) errors.staffDays = '근무 요일을 선택해주세요.';
    if (startTime === '') errors.startTime = '시작 시간을 선택해주세요.';
    if (endTime === '') errors.endTime = '종료 시간을 선택해주세요.';
    if (hourlyWage.trim() === '') errors.hourlyWage = '시급을 입력해주세요.';

    if (Object.keys(errors).length > 0) {
      setStaffErrors(errors);
      if (errors.staffName) staffNameRef.current?.focus();
      else if (errors.staffAge) staffAgeRef.current?.focus();
      else if (errors.staffParts) staffPartsRef.current?.querySelector('button')?.focus();
      else if (errors.staffDays) staffDaysRef.current?.querySelector('button')?.focus();
      else if (errors.startTime) staffStartTimeRef.current?.focus();
      else if (errors.endTime) staffEndTimeRef.current?.focus();
      else if (errors.hourlyWage) staffHourlyWageRef.current?.focus();
      return;
    }

    setStaffErrors({});
    setStaffItems((prev) => [
      ...prev,
      {
        name: staffName,
        age: staffAge,
        parts: staffParts,
        days: staffDays,
        startTime,
        endTime,
        hourlyWage,
        phone,
      },
    ]);
    setStaffName('');
    setStaffAge('');
    setStaffParts([]);
    setStaffDays([]);
    setStartTime('');
    setEndTime('');
    setHourlyWage('');
    setPhone('');
    setIsAddingStaff(false);
  };

  const handleDeleteStaff = (index) => {
    setStaffItems((prev) => prev.filter((_, i) => i !== index));
  };

  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const activeBtn = tabsRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    }
  }, [tab]);

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>

      <Link href="/onboarding/store-info" className={styles.backLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        이전 단계
      </Link>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>1. 계정 정보</span>
        </li>
        <li className={styles.step}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>2. 매장 정보</span>
        </li>
        <li className={`${styles.step} ${styles.active}`}>
          <span className={styles.stepLine}></span>
          <span className={styles.stepLabel}>3. 매장 세팅</span>
        </li>
      </ol>

      <div className={styles.heading}>
        <h1>매장 세팅</h1>
        <span>나중에 관리 페이지에서 추가할 수 있어요</span>
      </div>

      <div className={styles.tabs} ref={tabsRef}>
        <span
          className={styles.tabIndicator}
          style={{
            left: `${indicator.left}px`,
            width: `${indicator.width}px`,
            opacity: indicator.opacity,
          }}
        />
        {TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            data-active={tab === t.key}
            className={`${styles.tab} ${tab === t.key ? styles.active : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span
              className={styles.tabIcon}
              style={{ '--icon': `url(${t.icon})` }}
            />
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.tabPanel}>
        {tab === 'menu' && !isAddingMenu && menuItems.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIconBox}>
              <span
                className={styles.emptyIcon}
                style={{ '--icon': `url(/img/icon/menu.svg)` }}
              />
            </span>
            <h3 className={styles.emptyTitle}>아직 등록된 메뉴가 없어요.</h3>
            <p className={styles.emptyDesc}>메뉴를 등록하면 AI가 효자 메뉴와 아쉬운 메뉴를 찾아드려요</p>
            <button type="button" className={styles.addBtn} onClick={() => setIsAddingMenu(true)}>
              <span
                className={styles.addIcon}
                style={{ '--icon': `url("/img/icon/ic-plus(black).svg")` }}
              />
              첫 메뉴 추가하기
            </button>
          </div>
        )}

        {tab === 'menu' && isAddingMenu && (
          <div className={styles.itemForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>업종</label>
              <div className={styles.industryDisplay}>
                <span
                  className={styles.industryDisplayIcon}
                  style={{ '--icon': `url(${industryIcon})` }}
                />
                <span className={styles.industryDisplayLabel}>{industryLabel}</span>
                <svg className={styles.lockIcon} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 5a3 3 0 1 1 6 0v3H9V6z" />
                </svg>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>메뉴명</label>
              <input
                ref={menuNameRef}
                type="text"
                className={`${styles.fieldInput} ${menuErrors.menuName ? styles.fieldInputError : ''}`}
                placeholder="메뉴명을 입력해주세요."
                value={menuName}
                onChange={(e) => {
                  setMenuName(e.target.value);
                  clearError(setMenuErrors, 'menuName');
                }}
              />
              {menuErrors.menuName && <p className={styles.fieldError}>{menuErrors.menuName}</p>}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>가격</label>
              <input
                ref={menuPriceRef}
                type="text"
                className={`${styles.fieldInput} ${menuErrors.price ? styles.fieldInputError : ''}`}
                placeholder="메뉴의 가격을 입력해주세요."
                value={formatPrice(price)}
                onChange={handlePriceChange}
                inputMode="numeric"
              />
              {menuErrors.price && <p className={styles.fieldError}>{menuErrors.price}</p>}
            </div>

            <div className={styles.formField}>
              <div className={styles.categoryHeader}>
                <label className={styles.fieldLabel}>카테고리</label>
                {showAiBadge && (
                  <div className={styles.aiBadge}>
                    <span className={styles.aiBadgeText}>
                      <span className={styles.aiBadgeIcon}>★</span>
                      ai 카테고리 추천 : {AI_RECOMMENDED_CATEGORY}
                    </span>
                    <button type="button" className={styles.aiApplyBtn} onClick={handleApplyAiCategory}>
                      적용
                    </button>
                  </div>
                )}
              </div>

              {isAddingCustomCategory ? (
                <input
                  ref={menuCustomCategoryRef}
                  type="text"
                  className={`${styles.fieldInput} ${menuErrors.category ? styles.fieldInputError : ''}`}
                  placeholder="카테고리명을 입력 후 Enter"
                  value={customCategoryDraft}
                  onChange={(e) => {
                    setCustomCategoryDraft(e.target.value);
                    clearError(setMenuErrors, 'category');
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmCustomCategory(); } }}
                  onBlur={handleConfirmCustomCategory}
                  autoFocus
                />
              ) : (
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button
                    ref={menuCategoryRef}
                    type="button"
                    className={`${styles.dropdownTrigger} ${dropdownOpen ? styles.open : ''} ${menuErrors.category ? styles.dropdownTriggerError : ''}`}
                    onClick={() => setDropdownOpen((v) => !v)}
                  >
                    <span className={category ? styles.dropdownValue : styles.dropdownPlaceholder}>
                      {category || '카테고리를 선택해주세요.'}
                    </span>
                    <span
                      className={styles.dropdownChevron}
                      style={{ '--icon': `url(/img/icon/ic-down.svg)` }}
                    />
                  </button>
                  {dropdownOpen && (
                    <ul className={styles.dropdownMenu}>
                      {categoryOptions.map((cat) => (
                        <li
                          key={cat}
                          className={`${styles.dropdownItem} ${category === cat ? styles.dropdownItemSelected : ''}`}
                          onClick={() => handleSelectCategory(cat)}
                        >
                          <span>{cat}</span>
                          {category === cat && (
                            <span
                              className={styles.dropdownItemCheck}
                              style={{ '--icon': `url(/img/icon/ic-check.svg)` }}
                            />
                          )}
                        </li>
                      ))}
                      <li
                        className={`${styles.dropdownItem} ${styles.dropdownItemAdd}`}
                        onClick={handleStartCustomCategory}
                      >
                        + 카테고리 직접 추가
                      </li>
                    </ul>
                  )}
                </div>
              )}
              {menuErrors.category && <p className={styles.fieldError}>{menuErrors.category}</p>}
            </div>

            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleAddMenu}
            >
              <span
                className={styles.confirmIcon}
                style={{ '--icon': `url(/img/icon/ic-check.svg)` }}
              />
              추가
            </button>
          </div>
        )}

        {tab === 'menu' && !isAddingMenu && menuItems.length > 0 && (
          <div className={styles.itemList}>
            <ul className={styles.itemRows}>
              {menuItems.map((item, i) => (
                <li key={i} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.menuName}</span>
                    <span className={styles.itemDate}>{item.category}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemQuantity}>
                      {formatPrice(item.price)}<small>원</small>
                    </span>
                    <button
                      type="button"
                      className={styles.itemDelete}
                      onClick={() => handleDeleteMenu(i)}
                      aria-label="삭제"
                    >
                      <span
                        className={styles.deleteIcon}
                        style={{ '--icon': `url(/img/icon/ic-x.svg)` }}
                      />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.summaryBar}>
              <span className={styles.summaryStar}>★</span>
              <span className={styles.summaryText}>
                총 {menuItems.length}개의 메뉴가 등록되었습니다.
              </span>
            </div>

            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={() => setIsAddingMenu(true)}
            >
              <span
                className={styles.addMoreIcon}
                style={{ '--icon': `url("/img/icon/ic-plus(white).svg")` }}
              />
              메뉴추가
            </button>
          </div>
        )}

        {tab === 'stock' && !isAddingStock && stockItems.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIconBox}>
              <span
                className={styles.emptyIcon}
                style={{ '--icon': `url(/img/icon/inventory.svg)` }}
              />
            </span>
            <h3 className={styles.emptyTitle}>아직 등록된 상품이 없어요.</h3>
            <p className={styles.emptyDesc}>상품을 등록하시면 AI가 적정 재고를 추천해드려요.</p>
            <button type="button" className={styles.addBtn} onClick={() => setIsAddingStock(true)}>
              <span
                className={styles.addIcon}
                style={{ '--icon': `url("/img/icon/ic-plus(black).svg")` }}
              />
              첫 상품 추가하기
            </button>
          </div>
        )}

        {tab === 'stock' && isAddingStock && (
          <div className={styles.itemForm}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>상품명</label>
              <input
                ref={stockProductNameRef}
                type="text"
                className={`${styles.fieldInput} ${stockErrors.productName ? styles.fieldInputError : ''}`}
                placeholder="ex) 콜라"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  clearError(setStockErrors, 'productName');
                }}
              />
              {stockErrors.productName && <p className={styles.fieldError}>{stockErrors.productName}</p>}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>수량</label>
              <input
                ref={stockQuantityRef}
                type="text"
                className={`${styles.fieldInput} ${stockErrors.quantity ? styles.fieldInputError : ''}`}
                placeholder="ex) 2"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value.replace(/\D/g, ''));
                  clearError(setStockErrors, 'quantity');
                }}
              />
              {stockErrors.quantity && <p className={styles.fieldError}>{stockErrors.quantity}</p>}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>유통기한</label>
              <input
                ref={stockExpirationRef}
                type="text"
                className={`${styles.fieldInput} ${stockErrors.expirationDate ? styles.fieldInputError : ''}`}
                placeholder="0000 - 00 - 00"
                value={expirationDate}
                onChange={handleExpirationChange}
                maxLength={14}
                inputMode="numeric"
              />
              {stockErrors.expirationDate && <p className={styles.fieldError}>{stockErrors.expirationDate}</p>}
            </div>

            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleAddStock}
            >
              <span
                className={styles.confirmIcon}
                style={{ '--icon': `url(/img/icon/ic-check.svg)` }}
              />
              추가
            </button>
          </div>
        )}

        {tab === 'stock' && !isAddingStock && stockItems.length > 0 && (
          <div className={styles.itemList}>
            <ul className={styles.itemRows}>
              {stockItems.map((item, i) => (
                <li key={i} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.productName}</span>
                    <span className={styles.itemDate}>{item.expirationDate}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemQuantity}>
                      {item.quantity}<small>개</small>
                    </span>
                    <button
                      type="button"
                      className={styles.itemDelete}
                      onClick={() => handleDeleteStock(i)}
                      aria-label="삭제"
                    >
                      <span
                        className={styles.deleteIcon}
                        style={{ '--icon': `url(/img/icon/ic-x.svg)` }}
                      />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.summaryBar}>
              <span className={styles.summaryStar}>★</span>
              <span className={styles.summaryText}>
                총 {stockItems.length}개의 상품이 등록되었습니다.
              </span>
            </div>

            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={() => setIsAddingStock(true)}
            >
              <span
                className={styles.addMoreIcon}
                style={{ '--icon': `url("/img/icon/ic-plus(white).svg")` }}
              />
              상품추가
            </button>
          </div>
        )}

        {tab === 'staff' && !isAddingStaff && staffItems.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIconBox}>
              <span
                className={styles.emptyIcon}
                style={{ '--icon': `url(/img/icon/staff.svg)` }}
              />
            </span>
            <h3 className={styles.emptyTitle}>아직 등록된 직원이 없어요.</h3>
            <p className={styles.emptyDesc}>직원을 등록하면 급여 계산과 스케줄 관리를 도와드려요.</p>
            <button type="button" className={styles.addBtn} onClick={() => setIsAddingStaff(true)}>
              <span
                className={styles.addIcon}
                style={{ '--icon': `url("/img/icon/ic-plus(black).svg")` }}
              />
              첫 직원 등록하기
            </button>
          </div>
        )}

        {tab === 'staff' && isAddingStaff && (
          <div className={styles.itemForm}>
            <div className={styles.fieldRow}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>이름</label>
                <input
                  ref={staffNameRef}
                  type="text"
                  className={`${styles.fieldInput} ${staffErrors.staffName ? styles.fieldInputError : ''}`}
                  value={staffName}
                  onChange={(e) => {
                    setStaffName(e.target.value);
                    clearError(setStaffErrors, 'staffName');
                  }}
                />
                {staffErrors.staffName && <p className={styles.fieldError}>{staffErrors.staffName}</p>}
              </div>
              <div className={`${styles.formField} ${styles.fieldAge}`}>
                <label className={styles.fieldLabel}>나이</label>
                <input
                  ref={staffAgeRef}
                  type="text"
                  className={`${styles.fieldInput} ${staffErrors.staffAge ? styles.fieldInputError : ''}`}
                  value={staffAge}
                  onChange={(e) => {
                    setStaffAge(e.target.value.replace(/\D/g, '').slice(0, 3));
                    clearError(setStaffErrors, 'staffAge');
                  }}
                  inputMode="numeric"
                />
                {staffErrors.staffAge && <p className={styles.fieldError}>{staffErrors.staffAge}</p>}
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>근무 파트</label>
              <div className={styles.chipGroup} ref={staffPartsRef}>
                {PARTS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`${styles.chip} ${staffParts.includes(p) ? styles.chipActive : ''}`}
                    onClick={() => togglePart(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {staffErrors.staffParts && <p className={styles.fieldError}>{staffErrors.staffParts}</p>}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>근무 요일</label>
              <div className={styles.chipGroup} ref={staffDaysRef}>
                {DAYS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`${styles.dayChip} ${staffDays.includes(d) ? styles.chipActive : ''}`}
                    onClick={() => toggleDay(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {staffErrors.staffDays && <p className={styles.fieldError}>{staffErrors.staffDays}</p>}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>근무 시간</label>
              <div className={styles.timeRow} ref={timeDropdownRef}>
                <div className={`${styles.dropdown} ${styles.timeDropdown}`}>
                  <button
                    ref={staffStartTimeRef}
                    type="button"
                    className={`${styles.dropdownTrigger} ${openTimeDropdown === 'start' ? styles.open : ''} ${staffErrors.startTime ? styles.dropdownTriggerError : ''}`}
                    onClick={() => setOpenTimeDropdown(openTimeDropdown === 'start' ? null : 'start')}
                  >
                    <span className={startTime ? styles.dropdownValue : styles.dropdownPlaceholder}>
                      {startTime ? formatTimeLabel(startTime) : '시작시간'}
                    </span>
                    <span
                      className={styles.dropdownChevron}
                      style={{ '--icon': `url(/img/icon/ic-down.svg)` }}
                    />
                  </button>
                  {openTimeDropdown === 'start' && (
                    <ul className={styles.dropdownMenu}>
                      {TIME_OPTIONS.map((opt) => (
                        <li
                          key={opt.value}
                          className={`${styles.dropdownItem} ${startTime === opt.value ? styles.dropdownItemSelected : ''}`}
                          onClick={() => handleSelectTime('start', opt.value)}
                        >
                          <span>{opt.label}</span>
                          {startTime === opt.value && (
                            <span
                              className={styles.dropdownItemCheck}
                              style={{ '--icon': `url(/img/icon/ic-check.svg)` }}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <span className={styles.timeSeparator}>~</span>

                <div className={`${styles.dropdown} ${styles.timeDropdown}`}>
                  <button
                    ref={staffEndTimeRef}
                    type="button"
                    className={`${styles.dropdownTrigger} ${openTimeDropdown === 'end' ? styles.open : ''} ${staffErrors.endTime ? styles.dropdownTriggerError : ''}`}
                    onClick={() => setOpenTimeDropdown(openTimeDropdown === 'end' ? null : 'end')}
                  >
                    <span className={endTime ? styles.dropdownValue : styles.dropdownPlaceholder}>
                      {endTime ? formatTimeLabel(endTime) : '종료시간'}
                    </span>
                    <span
                      className={styles.dropdownChevron}
                      style={{ '--icon': `url(/img/icon/ic-down.svg)` }}
                    />
                  </button>
                  {openTimeDropdown === 'end' && (
                    <ul className={styles.dropdownMenu}>
                      {TIME_OPTIONS.map((opt) => (
                        <li
                          key={opt.value}
                          className={`${styles.dropdownItem} ${endTime === opt.value ? styles.dropdownItemSelected : ''}`}
                          onClick={() => handleSelectTime('end', opt.value)}
                        >
                          <span>{opt.label}</span>
                          {endTime === opt.value && (
                            <span
                              className={styles.dropdownItemCheck}
                              style={{ '--icon': `url(/img/icon/ic-check.svg)` }}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {(staffErrors.startTime || staffErrors.endTime) && (
                <p className={styles.fieldError}>{staffErrors.startTime || staffErrors.endTime}</p>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>시급(원)</label>
              <input
                ref={staffHourlyWageRef}
                type="text"
                className={`${styles.fieldInput} ${staffErrors.hourlyWage ? styles.fieldInputError : ''}`}
                placeholder="10,000원"
                value={formatHourlyWage(hourlyWage)}
                onChange={handleHourlyWageChange}
                onKeyDown={handleHourlyWageKeyDown}
                inputMode="numeric"
              />
              {staffErrors.hourlyWage && <p className={styles.fieldError}>{staffErrors.hourlyWage}</p>}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>전화번호(선택)</label>
              <input
                type="text"
                className={styles.fieldInput}
                placeholder="010-0000-0000"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="numeric"
              />
            </div>

            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleAddStaff}
            >
              <span
                className={styles.confirmIcon}
                style={{ '--icon': `url(/img/icon/ic-check.svg)` }}
              />
              추가
            </button>
          </div>
        )}

        {tab === 'staff' && !isAddingStaff && staffItems.length > 0 && (
          <div className={styles.itemList}>
            <ul className={styles.itemRows}>
              {staffItems.map((item, i) => (
                <li key={i} className={`${styles.itemRow} ${styles.staffRow}`}>
                  <div className={styles.staffLeft}>
                    <div className={styles.staffHead}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.staffMeta}>
                        {item.age}세{item.phone ? ` · ${item.phone}` : ''}
                      </span>
                    </div>
                    <div className={styles.staffDays}>
                      {DAYS.map((d) => (
                        <span
                          key={d}
                          className={`${styles.staffDayChip} ${item.days.includes(d) ? styles.chipActive : ''}`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.staffPartBadge}>{item.parts.join(', ')}</span>
                    <span className={styles.staffTime}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.startTime}~{item.endTime}
                    </span>
                    <span className={styles.staffWage}>{formatPrice(item.hourlyWage)}</span>
                    <button
                      type="button"
                      className={styles.itemDelete}
                      onClick={() => handleDeleteStaff(i)}
                      aria-label="삭제"
                    >
                      <span
                        className={styles.deleteIcon}
                        style={{ '--icon': `url(/img/icon/ic-x.svg)` }}
                      />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.summaryBar}>
              <span className={styles.summaryStar}>★</span>
              <span className={styles.summaryText}>
                총 {staffItems.length}명의 직원이 등록되었습니다.
              </span>
            </div>

            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={() => setIsAddingStaff(true)}
            >
              <span
                className={styles.addMoreIcon}
                style={{ '--icon': `url("/img/icon/ic-plus(white).svg")` }}
              />
              직원추가
            </button>
          </div>
        )}
      </div>

      <button type="button" className={styles.completeBtn} onClick={handleComplete}>
        설정완료
      </button>

    </div>
  )
}

export default Page
 