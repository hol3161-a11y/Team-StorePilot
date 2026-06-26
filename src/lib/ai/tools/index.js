// AI tools 정의 및 실행

import { runSalesTool } from './salesTools'
import { runStockTool } from './stockTools'
import { runMenuTool } from './menuTools'
import { runEmployeeTool } from './employeeTools'

export const toolDescriptions = [
  {
    name: 'get_today_sales',
    description: '오늘 매출을 조회할 때 사용'
  },
  {
    name: 'get_this_week_sales',
    description: '이번 주 매출 합계를 조회할 때 사용'
  },
  {
    name: 'get_last_week_sales',
    description: '지난주 매출 합계를 조회할 때 사용'
  },
  {
    name: 'compare_this_week_last_week',
    description: '이번 주 매출과 지난주 매출을 비교할 때 사용'
  },
  {
    name: 'get_average_sales',
    description: '최근 평균 매출을 조회할 때 사용'
  },
  {
    name: 'get_best_sales_day',
    description: '매출이 가장 높은 날짜를 찾을 때 사용'
  },
  {
    name: 'get_best_menu',
    description: '지정한 기간 동안 가장 많이 판매된 메뉴를 조회할 때 사용 (판매량 기준)'
  },
  {
    name: 'get_worst_menu',
    description: '지정한 기간 동안 판매량이 가장 저조한 메뉴를 조회할 때 사용'
  },
  {
    name: 'get_caution_stock',
    description: '부족한 재고를 조회할 때 사용'
  },
  {
    name: 'get_danger_stock',
    description: '유통기한 폐기 임박인 재고를 조회할 때 사용'
  },
  {
    name: 'get_stock_quantity',
    description: '특정 재고의 현재 수량을 조회할 때 사용'
  },
  {
    name: 'get_soldout_menu',
    description: '품절 메뉴를 조회할 때 사용'
  },
  {
    name: 'get_labor_cost',
    description: '인건비, 급여, 알바비를 기간별(오늘, 어제, 내일, 이번주, 저번주, 이번달, 저번달, 특정월, 특정날짜)로 계산할 때 사용 (예: 이번달 인건비, 4월 25일 인건비)'
  },
  {
    name: 'get_working_employees',
    description: '근무 인원이나 근무자를 기간별(오늘, 어제, 내일, 이번주, 저번주, 이번달, 저번달, 특정월, 특정날짜)로 조회할 때 사용 (예: 오늘 근무 인원, 4월 25일 근무자)'
  },
  {
    name: 'unknown',
    description: '사용 가능한 도구가 없을 때 사용'
  }
]

const toolRunnerMap = {
  //매출
  get_today_sales: runSalesTool,
  get_this_week_sales: runSalesTool,
  get_last_week_sales: runSalesTool,
  compare_this_week_last_week: runSalesTool,
  get_average_sales: runSalesTool,
  get_best_sales_day: runSalesTool,
  get_best_menu: runSalesTool,
  get_worst_menu: runSalesTool,


  //재고
  get_caution_stock: runStockTool,
  get_danger_stock: runStockTool,
  get_stock_quantity: runStockTool,

  //메뉴
  get_soldout_menu: runMenuTool,

  //직원
  get_labor_cost: runEmployeeTool,
  get_working_employees: runEmployeeTool

}

export async function runTool(toolName, params) {
  const runner = toolRunnerMap[toolName]

  if (!runner) {
    return null
  }

  return await runner(toolName, params)
}