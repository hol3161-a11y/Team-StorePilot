import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOption } from '@/app/api/auth/[...nextauth]/route'

// Google AI Studio API 키로 클라이언트 초기화
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const genAI_SALES = new GoogleGenerativeAI(process.env.AI_KEY_SALES);
const genAI_MENU = new GoogleGenerativeAI(process.env.AI_KEY_MENU);
const genAI_SCHEDULE = new GoogleGenerativeAI(process.env.AI_KEY_SCHEDULE);
const genAI_CATEGORY = new GoogleGenerativeAI(process.env.AI_KEY_CATEGORY);
const genAI_STOCK = new GoogleGenerativeAI(process.env.AI_KEY_STOCK);

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

  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email
  const salesData = await getSales(ownerId);

  /* 1단계: 직접 통계 계산 (AI 호출 전) */
  const calculatedData = calculatePredictedSales(salesData);

  /* 2단계: Gemma 4 31B 모델 준비 */
  const model = genAI_SALES.getGenerativeModel({ model: 'gemma-4-31b-it' });

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

  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email
  const menuData = await getMenus(ownerId);

  const data = menuData.map(s => ({ name: s.name, sales: s.sales }));

  // 1단계: 직접 통계 계산 (AI 호출 전)
  const maxmin = data.reduce((acc, cur) => {
    if (!acc.max || cur.sales > acc.max.sales) acc.max = cur;
    if (!acc.min || cur.sales < acc.min.sales) acc.min = cur;
    return acc;
  }, { max: null, min: null });

  // 2단계: Gemma 모델 준비
  const model = genAI_MENU.getGenerativeModel({ model: 'gemma-4-31b-it' });

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
const stockPrompt = async () => { };

/* 근무표 프롬프트 */
const schedulePrompt = async () => {

  // 직원 데이터 가져오기
  const { getEmployee } = await import('@/lib/db/employee');

  // 매출 데이터 가져오기
  const { getSales } = await import('@/lib/db/sales');

  const employeeData =
    await getEmployee('qwe@email.com', '001') || [];



  const salesData =
    await getSales('qwe@email.com', '001') || [];




  /* =========================
      1단계: 직접 통계 계산
  ========================= */

  const calcHours = (time) => {

    if (!time) return 0;

    const [start, end] = time.split('-');

    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    let diff = toMin(end) - toMin(start);

    // 🔥 야간 근무 처리
    if (diff < 0) {
      diff += 24 * 60;
    }

    return diff / 60;
  };


  let totalHours = 0;
  let totalPay = 0;

  employeeData.forEach(emp => {

    const hours = calcHours(emp.time);

    const pay = hours * (emp.hourlyWage || 0);

    totalHours += hours;
    totalPay += pay;
  });


  // 🔥 총 매출 계산
  const totalSales = (salesData || []).reduce((acc, cur) => {
    return acc + Number(cur.dailySales || 0);
  }, 0);


  // 🔥 인건비율
  const laborCostPercent =
    totalSales > 0
      ? ((totalPay / totalSales) * 100).toFixed(1)
      : 0;


  const calculatedData = {
    totalEmployees: employeeData.length,
    totalHours: Math.round(totalHours),
    totalPay: Math.round(totalPay),
    totalSales: Math.round(totalSales),
    laborCostPercent
  };


  /* =========================
      2단계: AI 모델 준비
  ========================= */

  const model = genAI_SCHEDULE.getGenerativeModel({ model: 'gemma-4-31b-it' });

  /* =========================
      3단계: AI 프롬프트
  ========================= */

  const prompt = `다음은 매장의 근무표 및 인건비 통계입니다.

- 총 직원 수: ${calculatedData.totalEmployees}명
- 총 근무시간: ${calculatedData.totalHours}시간
- 총 인건비: ${calculatedData.totalPay.toLocaleString()}원
- 총 매출: ${calculatedData.totalSales.toLocaleString()}원
- 인건비율: ${calculatedData.laborCostPercent}%

현재 근무 운영 상태와 인건비 효율성을 분석하세요.

어려운 단어 없이 쉽게 설명하세요.
딱딱한 표현은 사용하지 마세요.

summary는 짧은 한 줄로 작성하세요.
advice도 짧은 한 줄로 작성하세요.

예시:
{
  "summary": "현재 인건비는 조금 높은 편입니다.",
  "advice": "직원 근무 시간을 조금 조정해보세요."
}
`;


  /* =========================
      4단계: 응답 유효성 검사
  ========================= */

  const isValid = (parsed) => {

    const s = parsed?.summary ?? '';
    const a = parsed?.advice ?? '';

    return (
      s.length > 20 &&
      a.length > 20 &&
      !s.includes('...') &&
      !a.includes('...')
    );
  };


  /* =========================
      5단계: 최대 3회 재시도
  ========================= */

  let analysisResult = null;

  for (let attempt = 0; attempt < 3; attempt++) {

    const result = await model.generateContent(prompt);

    const text = result.response
      .text()
      .replace(/```json|```/g, '')
      .trim();

    const jsonMatch =
      text.match(/\{(?:[^{}]|{[^{}]*})*\}/);

    if (jsonMatch) {

      try {

        const parsed = JSON.parse(jsonMatch[0]);

        if (isValid(parsed)) {

          analysisResult = parsed;
          break;
        }

      } catch {
        console.log(
          'JSON 파싱 실패',
          attempt + 1,
          '/3 번째 반복중'
        );
      }
    }
  }


  /* =========================
      6단계: fallback
  ========================= */

  if (!analysisResult) {

    analysisResult = {
      summary: '근무표 분석 결과를 가져오지 못했습니다.',
      advice: ''
    };
  }


  /* =========================
      7단계: 최종 반환
  ========================= */

  return NextResponse.json({
    ...calculatedData,
    ...analysisResult
  });
};

/* 카테고리 추천 프롬프트 */
const categoryPrompt = async (industry, customIndustry) => {
  // 업종 라벨 매핑 (클라이언트의 industry key → 한국어 라벨)
  // 단, 'other' 선택 시 사장님이 직접 입력한 업종명(customIndustry)이 있으면 그것을 우선 사용
  const industryLabels = {
    restaurant: '요식업',
    cafe: '카페',
    other: '기타',
  };
  const industryLabel = (industry === 'other' && customIndustry?.trim())
    ? customIndustry.trim()
    : (industryLabels[industry] ?? '기타');

  // Gemma 모델 준비
  const model = genAI_CATEGORY.getGenerativeModel({ model: 'gemma-4-31b-it' });

  // 업종에 어울리는 메뉴 카테고리 6~10개 추천 요청
  const prompt = `당신은 매장 운영 컨설턴트입니다.
  아래 입력한 업종에서 보편적으로 판매하거나 제공하는 상품 및 서비스 카테고리를 6개에서 10개 사이로 추천해주세요.
 업종 : "${industryLabel}"

조건:
- 각 카테고리는 2~6글자 한국어
- 중복되거나 의미가 겹치는 항목 금지
- 너무 세부적이지 않고 보편적인 분류로
- 항목 개수는 6개 이상 10개 이하
- 마지막 항목은 반드시 "기타"

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 아래 형식으로만 반환하세요.
{"categories": ["카테고리1", "카테고리2", "...", "기타"]}`;

  /* 4단계: AI 응답 유효성 검사 - 카테고리 배열 구조 체크 */
  const isValid = (parsed) => {
    const arr = parsed?.categories;
    if (!Array.isArray(arr)) return false;
    if (arr.length < 3 || arr.length > 10) return false;
    return arr.every((c) => typeof c === 'string' && c.trim().length > 0 && c.length <= 10);
  };

  /* 4-1단계: 최대 3회 재시도 (menuPrompt와 동일 패턴) */
  let analysisResult = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await model.generateContent(prompt);
    /* 코드블록 제거 후 JSON 블록 모두 추출해 순서대로 파싱 시도 */
    const text = result.response.text().replace(/```json|```/g, '').trim();
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

  /* 3회 모두 실패한 경우 fallback - 업종별 기본 카테고리 */
  if (!analysisResult) {
    const fallback = {
      restaurant: ['메인', '사이드', '음료', '세트', '디저트', '기타'],
      cafe: ['커피', '논커피', '브런치', '세트', '디저트', '기타'],
      other: ['상품', '서비스', '기타'],
    };
    analysisResult = { categories: fallback[industry] ?? fallback.other };
  }

  /* 5단계: 결과 반환 */
  return NextResponse.json(analysisResult);
};

/* AI 호출 */
export async function POST(req) {
  try {
    const { keyword, ownerId, industry, customIndustry } = await req.json();

    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId가 필요합니다.' }, { status: 400 });
    }

    switch (keyword) {
      case 'sales':
        return await salesPrompt(ownerId);
      case 'menu':
        return await menuPrompt(ownerId);
      case 'schedule':
        return await schedulePrompt(ownerId);
      case 'stock':
        return await stockPrompt(ownerId);
      case 'category':
        return await categoryPrompt(industry, customIndustry);
    }
  } catch (e) {
    console.error('[AI] 에러:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
