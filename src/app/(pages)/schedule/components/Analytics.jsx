'use client';

import styles from './Analytics.module.scss';
import { useState } from 'react';

function Analytics({ employees = [] }) {

  const [payType, setPayType] = useState('day');

  // 근무 요일 수
  const getWorkDays = (emp) => {
    if (!emp.days) return 0;

    if (emp.days.includes('주말')) return 2;

    return emp.days.split('/').length;
  };

  // 시간 계산
  const calcHours = (emp) => {
    if (!emp.time) return 0;

    const [start, end] = emp.time.split('-');

    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    return (toMin(end) - toMin(start)) / 60;
  };

  // 급여 계산
  const calcPay = (emp) => {
    const hours = calcHours(emp);
    const wage = emp.hourlyWage || 0;

    const dayPay = hours * wage;

    const workDays = getWorkDays(emp);

    if (payType === 'day') return Math.round(dayPay);
    if (payType === 'week') return Math.round(dayPay * workDays);
    if (payType === 'month') return Math.round(dayPay * workDays * 4);

    return Math.round(dayPay);
  };

  // 총 인건비
  const total = employees.reduce((sum, emp) => {
    return sum + calcPay(emp);
  }, 0);

  return (
    <div className={styles.analytics}>

      {/* AI 영역 */}
      <div className={styles.analyticsAi}>
        <div className={styles.analyticsHeader}>
          <img src='./img/icon/ic-AI.svg' />
          <h2>AI 분석</h2>
        </div>

        <div className={styles.analyticsList}>
          <ul>
            <li>
              <span>AI 분석 내용1</span>
              <span>AI 추천 내용1</span>
            </li>
            <li>
              <span>AI 분석 내용2</span>
              <span>AI 추천 내용2</span>
            </li>
            <li>
              <span>AI 분석 내용3</span>
              <span>AI 추천 내용3</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 직원별 인건비 */}
      <div className={styles.employee}>
        <div className={styles.analyticsHeader}>
          <img src='./img/icon/ic_schedul-analytics.svg' />
          <h2>직원별 인건비 분석</h2>

          <div className={styles.btn}>
            <button
              className={payType === 'day' ? styles.activeBtn : ''}
              onClick={() => setPayType('day')}
            >
              일급
            </button>

            <button
              className={payType === 'week' ? styles.activeBtn : ''}
              onClick={() => setPayType('week')}
            >
              주급
            </button>

            <button
              className={payType === 'month' ? styles.activeBtn : ''}
              onClick={() => setPayType('month')}
            >
              월급
            </button>
          </div>
        </div>

        <ul className={styles.employeeList}>
          {employees.map((emp, i) => (
            <li key={i} className={styles.employeeItem}>
              <span>{emp.name}</span>
              <span>근무 시간 : {emp.startTime} ~ {emp.endTime}</span>
              <span className={styles.payDetail}>
                {Math.round(calcHours(emp))}시간 × {emp.hourlyWage?.toLocaleString()}원 =
                {' '}
                <strong>{calcPay(emp).toLocaleString()}원</strong>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 총 인건비 */}
      <div className={styles.employeeTotal}>
        <span>총 인건비</span>
        <span>{total.toLocaleString()}원</span>
      </div>

    </div>
  );
}

export default Analytics;