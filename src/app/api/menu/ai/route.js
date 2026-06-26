import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Google AI Studio API 키로 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// ─── POST /api/sales/openai ───────────────────────────────────────────────────
// 클라이언트에서 menuData를 받아 통계 계산 후 Gemma AI에게 분석 요청
// 응답: { predictedAmount, trend, recentAverage, maxAmount, minAmount, summary, advice }
export async function POST(req) {
    try {
        console.log('axios 들어감');

        // 클라이언트에서 전달한 menuData: [{ date, amount }, ...]
        const { menuData } = await req.json();



        // 1단계: 직접 통계 계산 (AI 호출 전)
        const maxmin = menuData.reduce((acc, cur) => {
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

        반드시 아래 형식으로 응답하세요. 다른 텍스트 없이 아래 형식으로만 반환하세요.
        {
  "summary": "예: 후라이드는 판매량이 매우 높고...",
  "advice": "예: 인기 메뉴를 전면에 배치하세요"
}
`;

        const result = await model.generateContent(prompt);


        // 4단계: AI 응답에서 JSON 추출
        // 모델이 JSON 외 텍스트를 붙일 수 있으므로 정규식으로 첫 번째 JSON 객체만 추출
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{(?:[^{}]|{[^{}]*})*\}/); // 중첩 없는 첫 번째 JSON 객체
        console.log(JSON.parse(jsonMatch[0]), '==================================')
        const analysisResult = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { summary: '분석 결과를 가져오지 못했습니다.', advice: '' }; // 파싱 실패 시 fallback

        // 5단계: 계산값 + AI 분석 합쳐서 반환
        return NextResponse.json({
  max: {
    ...maxmin.max,
    summary: analysisResult.summary,
    advice: analysisResult.advice
  },
  min: {
    ...maxmin.min,
    summary: analysisResult.summary,
    advice: analysisResult.advice
  }
});
    } catch (e) {
        console.error('[AI] 에러:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}