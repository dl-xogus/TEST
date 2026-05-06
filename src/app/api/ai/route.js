import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Google AI Studio API 키로 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/* 예상매출액 계산 */
export const calculatePredictedSales = (salesData) => {
  const data = salesData.map(s => ({ date: s.date, amount: Number(s.dailySales) }));

  /* 최근 7일 데이터만 추출 */
  const recent = data.slice(-7);

  /* 최근 7일 평균 → 예상 매출액으로 사용 */
  const average = recent.reduce((sum, d) => sum + d.amount, 0) / recent.length;

  /* 트렌드: 가장 마지막 날 매출 vs 7일 전 매출 비교 */
  /* 데이터가 7개 미만이면 첫 번째 날과 비교 */
  const last = data.at(-1)?.amount ?? 0;
  const prev = data.length >= 7 ? data.at(-7)?.amount ?? 0 : data.at(0)?.amount ?? 0;
  const trend = last > prev ? '상승' : '하락';

  return {
    predictedAmount: Math.round(average),  // 예상 매출액
    trend,                                  // 상승 / 하락
    recentAverage: Math.round(average),     // 최근 7일 평균 (predictedAmount와 동일)
    maxAmount: Math.max(...data.map(d => d.amount)),  // 전체 기간 최고 매출
    minAmount: Math.min(...data.map(d => d.amount)),  // 전체 기간 최저 매출
  };
};

/* 매출 프롬프트 */
const salesPrompt = async () => {
  // 서버 안에서 상대경로 axios 호출 불가 → DB 함수 직접 import해서 사용
  const { getSales } = await import('@/lib/db/sales');
  const salesData = await getSales('qwe@email.com', '001');

  /* 1단계: 직접 통계 계산 (AI 호출 전) */
  const calculatedData = calculatePredictedSales(salesData);

  /* 2단계: Gemma 4 31B 모델 준비 */
  const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });

  /* 3단계: 계산된 통계를 프롬프트에 담아 AI에게 분석 요청 */
  /* JSON 형식으로만 응답하도록 강제 */
  const prompt = `다음은 매장의 매출 통계입니다.
- 예상 매출액: ${calculatedData.predictedAmount.toLocaleString()}원
- 트렌드: ${calculatedData.trend}
- 최근 7일 평균: ${calculatedData.recentAverage.toLocaleString()}원
- 최고 매출: ${calculatedData.maxAmount.toLocaleString()}원
- 최저 매출: ${calculatedData.minAmount.toLocaleString()}원

반드시 아래 JSON형식으로만 응답하세요. 다른 텍스트 없이 아래 형식으로만 반환하세요. 아래 형식 안에 분석과 조언을 넣으세요. 분석과 조언은 20자 이상으로 대답하세요.
{"summary": "2-3줄 분석", "advice": "한 줄 조언"}`;

  /* 4단계: AI 응답 유효성 검사 */
  /* Gemma는 JSON 모드를 지원하지 않아 프롬프트로만 유도하는데, */
  /* 간혹 "..." 같은 placeholder나 코드블록(```json)을 붙여 응답하는 경우가 있음 */
  /* → JSON 파싱 성공 여부 + 내용 유효성까지 함께 체크 */
  const isValid = (parsed) => {
    const s = parsed?.summary ?? '';
    const a = parsed?.advice ?? '';
    /* 20자 미만이거나 "..."이 포함된 경우 placeholder로 간주해 무효 처리 */
    return s.length > 20 && a.length > 20 && !s.includes('...') && !a.includes('...');
  };

  /* 4-1단계: 최대 3회 재시도 (파싱 실패 또는 내용 무효 시 재호출) */
  let analysisResult = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await model.generateContent(prompt);
    /* 코드블록 제거 후 첫 번째 JSON 객체 추출 */
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const jsonMatch = text.match(/\{(?:[^{}]|{[^{}]*})*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (isValid(parsed)) {
          analysisResult = parsed;
          break; // 유효한 응답을 얻으면 즉시 종료
        }
        console.log('파싱은 됐지만 내용이 무효', attempt + 1, '/3 번째 반복중');
      } catch {
        console.log('JSON 파싱 실패 재시도', attempt + 1, '/3 번째 반복중')
      }
    }
  }

  /* 3회 모두 실패한 경우 fallback */
  if (!analysisResult) {
    analysisResult = { summary: '분석 결과를 가져오지 못했습니다.', advice: '' };
  }

  /* 5단계: 계산값 + AI 분석 합쳐서 반환 */
  return NextResponse.json({ ...calculatedData, ...analysisResult });
};

/* 메뉴 프롬프트 */
const menuPrompt = async () => {
  // 서버 안에서 상대경로 axios 호출 불가 → DB 함수 직접 import해서 사용
  const { getMenus } = await import('@/lib/db/menu');
  const menuData = await getMenus('qwe@email.com', '001');

  const data = menuData.map(s => ({ name: s.name, sales: s.sales }));

  // 1단계: 직접 통계 계산 (AI 호출 전)
  const maxmin = data.reduce((acc, cur) => {
    if (!acc.max || cur.sales > acc.max.sales) acc.max = cur;
    if (!acc.min || cur.sales < acc.min.sales) acc.min = cur;
    return acc;
  }, { max: null, min: null });

  // 2단계: Gemma 모델 준비
  const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });

  // 3단계: 계산된 통계를 프롬프트에 담아 AI에게 분석 요청
  // JSON 형식으로만 응답하도록 강제
  const prompt = `다음은 매장의 판매량 통계입니다.

최고 판매 메뉴:
이름: ${maxmin.max?.name}
판매량: ${maxmin.max?.sales}

최저 판매 메뉴:
이름: ${maxmin.min?.name}
판매량: ${maxmin.min?.sales}

summary에는 2-3줄 분석
advice에는 한 줄 조언
을 너가 적어줘

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 아래 형식으로만 반환하세요.
{"max":{"summary":"최고 메뉴 분석 내용","advice":"최고 메뉴 조언"},"min":{"summary":"최저 메뉴 분석 내용","advice":"최저 메뉴 조언"}}`;

  /* 4단계: AI 응답 유효성 검사 - 메뉴용 중첩 구조 체크 */
  const isValid = (parsed) => {
    const maxS = parsed?.max?.summary ?? '';
    const maxA = parsed?.max?.advice ?? '';
    const minS = parsed?.min?.summary ?? '';
    const minA = parsed?.min?.advice ?? '';
    return maxS.length > 20 && maxA.length > 20 && minS.length > 20 && minA.length > 20
      && !maxS.includes('...') && !minS.includes('...');
  };

  /* 4-1단계: 최대 3회 재시도 (파싱 실패 또는 내용 무효 시 재호출) */
  let analysisResult = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await model.generateContent(prompt);
    /* 코드블록 제거 후 중첩 JSON까지 포함해 추출 */
    const text = result.response.text().replace(/```json|```/g, '').trim();
    /* 텍스트 안에서 중첩 JSON 블록을 모두 추출해 순서대로 파싱 시도 */
    const jsonMatches = [...text.matchAll(/\{(?:[^{}]|\{[^{}]*\})*\}/g)];
    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match[0]);
        if (isValid(parsed)) { analysisResult = parsed; break; }
      } catch { /* 파싱 실패 시 다음 블록으로 */ }
    }
    if (!analysisResult && attempt < 2) {
      console.log('유효한 JSON 없음, 재시도', attempt + 1, '/3');
    }
  }

  /* 3회 모두 실패한 경우 fallback - 메뉴용 중첩 구조로 */
  if (!analysisResult) {
    analysisResult = {
      max: { summary: '분석 결과를 가져오지 못했습니다.', advice: '' },
      min: { summary: '분석 결과를 가져오지 못했습니다.', advice: '' },
    };
  }

  /* 5단계: 계산값 + AI 분석 합쳐서 반환 */
  return NextResponse.json({
    max: {
      ...maxmin.max,
      summary: analysisResult.max.summary,
      advice: analysisResult.max.advice
    },
    min: {
      ...maxmin.min,
      summary: analysisResult.min.summary,
      advice: analysisResult.min.advice
    }
  });
};

/* 재고 프롬프트 */
const stockPrompt = async () => {};

/* 근무표 프롬프트 */
const schedulePrompt = async () => {
  // 서버 안에서 상대경로 axios 호출 불가 → DB 함수 직접 import해서 사용
  const { getSales } = await import('@/lib/db/sales');
  const salesData = await getSales('qwe@email.com', '001');

  /* 1단계: 직접 통계 계산 (AI 호출 전) */
  const calculatedData = calculatePredictedSales(salesData);

  /* 2단계: Gemma 4 31B 모델 준비 */
  const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });

  /* 3단계: 계산된 통계를 프롬프트에 담아 AI에게 분석 요청 */
  /* JSON 형식으로만 응답하도록 강제 */
  const prompt = `다음은 매장의 매출 통계입니다.
- 예상 매출액: ${calculatedData.predictedAmount.toLocaleString()}원
- 트렌드: ${calculatedData.trend}
- 최근 7일 평균: ${calculatedData.recentAverage.toLocaleString()}원
- 최고 매출: ${calculatedData.maxAmount.toLocaleString()}원
- 최저 매출: ${calculatedData.minAmount.toLocaleString()}원

반드시 아래 JSON형식으로만 응답하세요. 다른 텍스트 없이 아래 형식으로만 반환하세요. 아래 형식 안에 분석과 조언을 넣으세요. 분석과 조언은 20자 이상으로 대답하세요.
{"summary": "2-3줄 분석", "advice": "한 줄 조언"}`;
};

/* AI 호출 */
export async function POST(req) {
  try {
    const { keyword } = await req.json();

    switch (keyword) {
      case 'sales':
        return await salesPrompt();
      case 'menu':
        return await menuPrompt();
      case 'stock':
        return await stockPrompt();
      case 'schedule':
        return await schedulePrompt();
    }
  } catch (e) {
    console.error('[AI] 에러:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
