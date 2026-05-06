'use client'

import styles from './schedule.module.scss';
import ScheduleItem from './components/ScheduleItem';
import Analytics from './components/Analytics';
import { useEffect, useState } from 'react';
import axios from 'axios';

function Schedule() {

  const [employees, setEmployees] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState([]);

  const session = { email: 'qwe@email.com' };

  // 직원 가져오기
  useEffect(() => {
    const getEmployee = async () => {
      const res = await axios.get('/api/employee/db', {
        params: {
          ownerId: session.email,
          storeId: '001',
        }
      });

      setEmployees(res.data.employees);
    };

    getEmployee();
  }, []);

  //체크 선택
  const handleSelect = (index) => {
    setSelected(prev =>
      prev.includes(index)
        ? prev.filter(v => v !== index)
        : [...prev, index]
    );
  };

  // DELETE 선택
  const handleDeleteSelected = async () => {
    const deleteData = employees.filter((_, i) => {
      return !selected.includes(i);
    });

    await fetch('/api/employee/db', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: session.email,
        employees: deleteData
      })
    });

    setEmployees(deleteData);
    setSelected([]);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // DELETE
  const handleUpdate = async (_id, updatedData) => {

    const editData = sortedEmployees.map((obj, i) => {
      if (i === _id) {
        obj = updatedData;
      }
      return obj;
    })

    const res = await fetch('/api/employee/db', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: session.email, employees: editData, type: 'update' })
    });

    const data = await res.json();

    if (!res.ok) {
      alert('수정 실패');
      return;
    }


    setEmployees(editData);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // 오늘 요일 자동 선택
  useEffect(() => {
    const today = new Date();
    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    setSelectedDay(dayMap[today.getDay()]);
  }, []);

  // 이전 주 이동
  const goPrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // 주차 계산
  const getWeekOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeek = firstDay.getDay();

    return Math.ceil((date.getDate() + firstDayWeek) / 7);
  };

  // 주간 날짜
  const getWeekDates = () => {
    const date = new Date(currentDate);
    const day = date.getDay();

    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  // 날짜 포맷
  const formatDate = (date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 직원 필터
  const filteredEmployees = employees.filter(emp => {
    if (!emp.days) return false;

    if (emp.days.includes('주말')) {
      return selectedDay === '토' || selectedDay === '일';
    }

    return emp.days.includes(selectedDay);
  });

  return (
    <section className={styles.schedule}>
      <div className={styles.container}>

        <div className={styles.scheduleMain}>

          {/* 헤더 */}
          <div className={styles.scheduleHeader}>
            <h2>
              <span className={styles.scheduleTitle}>근무표</span> 관리
            </h2>
            <div className={styles.total}>
              <img src='./img/icon/ic_schedul-person.svg' />
              <p>Total : {employees.length}명</p>
            </div>
          </div>

          <div className={styles.schedulePanel}>

            {/* 주차 + 날짜 */}
            <div className={styles.scheduleNav}>

              <div className={styles.scheduleNavArrow}>
                <img
                  src='./img/icon/ic-schedul-left.svg'
                  onClick={goPrevWeek}
                />

                <b>
                  {currentDate.getMonth() + 1}월 {getWeekOfMonth(currentDate)}주차
                </b>
              </div>

              <div className={styles.scheduleNavDate}>
                <img src='./img/icon/ic_schedul-calendar.svg' />
                <p>
                  {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                </p>
              </div>

            </div>

            {/* 요일 */}
            <div className={styles.scheduleWeek}>
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => {
                const date = weekDates[i];

                return (
                  <p
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      ${selectedDay === day ? styles.active : ''}
                 
                    `}
                  >
                    {day}
                  </p>
                );
              })}
            </div>

            {/* 리스트 */}
            <div className={styles.scheduleList}>

              <div className={styles.scheduleDayHeader}>
                <div className={styles.scheduleDay}>
                  <b>{selectedDay}요일</b>
                  <p>
                    {
                      weekDates[
                        ['일', '월', '화', '수', '목', '금', '토'].indexOf(selectedDay)
                      ]?.getDate()
                    }일
                  </p>
                </div>
                <img src='./img/icon/ic_schedule-bin.svg' onClick={handleDeleteSelected} />
              </div>

              {filteredEmployees.map((emp) => {
                const originalIndex = employees.indexOf(emp);

                return (
                  <ScheduleItem
                    key={originalIndex}
                    emp={emp}
                    index={originalIndex}
                    onSelect={handleSelect}
                    selected={selected}
                  />
                );
              })}

            </div>

          </div>
        </div>

        <Analytics employees={filteredEmployees} />

      </div>
    </section>
  );
}

export default Schedule;
