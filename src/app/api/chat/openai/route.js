import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { toolDescriptions, runTool } from '@/lib/ai/tools'

const genAI = new GoogleGenerativeAI(process.env.AI_KEY_CHAT)

async function callLLM(messages, temperature = 0.3) {
  const model = genAI.getGenerativeModel({
    model: 'gemma-4-31b-it',
    generationConfig: { temperature }
  })

  const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
  const userMsg = messages.find(m => m.role === 'user')?.content ?? ''

  const result = await model.generateContent(`${systemMsg}\n\n${userMsg}`)
  return result.response.text()
}

function safeJsonParse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    const match = cleaned.match(/\{(?:[^{}]|\{[^{}]*\})*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch (error) {
    return null
  }
}

// 질문 문장에 있는 기간 표현을 서버에서 한 번 더 보정
function fixPeriodByQuestion(question, period) {
  if (/\d{1,2}월\s*\d{1,2}일/.test(question)) {
    return 'date'
  }

  if (question.includes('어제')) {
    return 'yesterday'
  }

  if (question.includes('내일')) {
    return 'tomorrow'
  }

  if (
    question.includes('저번주') ||
    question.includes('저번 주') ||
    question.includes('지난주') ||
    question.includes('지난 주') ||
    question.includes('전주')
  ) {
    return 'last_week'
  }

  if (
    question.includes('이번주') ||
    question.includes('이번 주')
  ) {
    return 'this_week'
  }

  if (
    question.includes('이번달') ||
    question.includes('이번 달')
  ) {
    return 'this_month'
  }

  if (
    question.includes('저번달') ||
    question.includes('지난달') ||
    question.includes('전월')
  ) {
    return 'last_month'
  }

  if (
    question.includes('오늘') ||
    question.includes('금일')
  ) {
    return 'today'
  }

  if (
    question.includes('요즘') ||
    question.includes('최근') ||
    question.includes('최근 7일')
  ) {
    return 'recent_7_days'
  }

  return period || 'all'
}

function extractMonthDay(question) {
  const match = question.match(/(\d{1,2})월\s*(\d{1,2})일/)

  if (!match) {
    return {
      month: null,
      day: null
    }
  }

  return {
    month: Number(match[1]),
    day: Number(match[2])
  }
}

export async function POST(request) {
  try {
    const { question, ownerId, storeId } = await request.json()

    const toolSelectText = await callLLM(
      [
        {
          role: 'system',
          content: `
너는 사용자의 질문을 보고 가장 적절한 도구 하나만 선택하는 AI야.

사용 가능한 도구:
${toolDescriptions.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

반드시 아래 JSON 형식으로만 답해.
설명 문장 없이 JSON만 반환해.

{
  "tool": "도구이름",
  "period": "today | yesterday | tomorrow | this_week | last_week | this_month | last_month | month | date | all",
  "month": 1,
  "day": 25,
  "menuType": "all_food | main | side",
  "stockName": "재고명 또는 null"
}

tool 선택 규칙:
- "안 팔린", "덜 팔린", "저조한", "판매 저조", "제일 안 나간", "안팔린","안 팔리는","안팔리는" "안 나가는" 표현이 있으면 tool은 "get_worst_menu"
- "잘 팔린", "인기", "최고", "많이 팔린","잘팔린","잘팔리는" ,"잘 팔리는", "잘 나가는" 표현이 있으면 tool은 "get_best_menu"

period 선택 규칙:
- "오늘", "금일" → "today"
- "어제" → "yesterday"
- "내일"이 있으면 "tomorrow"
- "이번주" → "this_week"
- "저번주", "지난주" → "last_week"
- "이번달" → "this_month"
- "저번달" → "last_month"
- "4월 25일", "3월 10일"처럼 숫자+월+숫자+일이 있으면 period는 "date", month는 월 숫자, day는 일 숫자
- 기간 표현이 전혀 없을 때만 "all"

menuType 선택 규칙 (중요: 아래 순서대로 판단):
1. "사이드", "사이드메뉴", "사이드 메뉴"가 있으면 → "side"
2. "메인", "메인메뉴", "메인 메뉴", "식사메뉴"가 있으면 → "main"
3. 위 조건이 없고 "메뉴", "팔린", "팔리는" 등의 일반 표현이면 → "all_food"

stockName 선택 규칙:
- 사용자가 특정 재고명, 식재료명, 메뉴 재료명을 말하면 stockName에 넣어라.
- 예: "닭날개 얼마나 남았어?" → "닭날개"
- 예: "뼈닭 재고 있어?" → "뼈닭"
- 특정 재고명이 없으면 null

          `
        },
        {
          role: 'user',
          content: question
        }
      ],
      0
    )

    const parsed = safeJsonParse(toolSelectText)

    if (!parsed?.tool) {
      return NextResponse.json({
        success: false,
        answer: '질문 의도를 분석하지 못했습니다.'
      })
    }

    if (parsed.tool === 'unknown') {
      return NextResponse.json({
        success: true,
        answer: '아직 처리할 수 없는 질문입니다.'
      })
    }

    const fixedPeriod = fixPeriodByQuestion(question, parsed.period)
    const extractedDate = extractMonthDay(question)

    const toolResult = await runTool(parsed.tool, {
      ownerId,
      storeId,
      period: fixedPeriod,
      month: extractedDate.month || parsed.month || null,
      day: extractedDate.day || parsed.day || null,
      menuType: parsed.menuType || 'all_food',
      stockName: parsed.stockName || null
    })

    console.log('toolSelectText :::::::::: ', toolSelectText)
    console.log('parsed :::::::::: ', parsed)
    console.log('fixedPeriod :::::::::: ', fixedPeriod)
    console.log('toolResult ::::::::::', toolResult)

    if (!toolResult) {
      return NextResponse.json({
        success: true,
        answer: '해당 질문에 사용할 수 있는 데이터 도구가 없습니다.'
      })
    }

    const finalAnswer = await callLLM(
      [
        {
          role: 'system',
          content: `너는 매장 관리 데이터를 대표님이 이해하기 쉽게 설명하는 AI야.

다음 규칙을 반드시 지켜서 답변해:

1.숫자는 절대 임의로 바꾸지 말고, 입력 데이터 그대로 사용한다.
2.설명은 2~4문장 이내로 간결하게 작성한다.
3.어려운 용어 없이 누구나 이해할 수 있게 작성한다.
4.마지막에는 반드시 "분석" 섹션을 추가한다.

출력 형식:

[설명]
핵심 설명 명확하고 간결하게

[분석]
데이터 기반 인사이트 1~2줄 (줄바꿈 포함)`
        },
        {
          role: 'user',
          content: `
사용자 질문:
${question}

조회된 데이터:
${JSON.stringify(toolResult, null, 2)}

위 데이터만 근거로 답변해줘.
          `
        }
      ],
      0.3
    )

    const lastIdx = finalAnswer.lastIndexOf('[설명]')
    const cleanAnswer = lastIdx !== -1 ? finalAnswer.slice(lastIdx) : finalAnswer

    return NextResponse.json({
      success: true,
      answer: cleanAnswer
    })
  } catch (error) {
    console.error('chat route error:', error)

    return NextResponse.json(
      {
        success: false,
        answer: `답변을 생성하지 못했습니다. ${error.message}`
      },
      { status: 500 }
    )
  }
}