// 매출 tools

import { getSales } from '@/lib/db/sales'
import { getMenus } from '@/lib/db/menu'

// 오늘 날짜를 YYYY-MM-DD 형태로 반환
function getToday() {
  return formatDate(new Date())
}

// 오늘 날짜와 일치하는 매출을 찾아 숫자로 반환
function getTodaySales(sales) {
  const today = getToday()
  const found = sales.find(item => item.date === today)

  return Number(String(found?.dailySales || 0).replaceAll(',', '')) || 0
}

// 이번 주 시작(일요일) ~ 종료(토요일) 날짜 범위 반환
function getThisWeekRange() {
  const today = new Date()
  const day = today.getDay()

  const start = new Date(today)
  start.setDate(today.getDate() - day)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const format = (d) => formatDate(d)

  return {
    startDate: format(start),
    endDate: format(end)
  }
}

// 지난 주 시작(일요일) ~ 종료(토요일) 날짜 범위 반환
function getLastWeekRange() {
  const today = new Date()
  const day = today.getDay()

  const thisWeekSunday = new Date(today)
  thisWeekSunday.setDate(today.getDate() - day)

  const lastWeekSunday = new Date(thisWeekSunday)
  lastWeekSunday.setDate(thisWeekSunday.getDate() - 7)

  const lastWeekSaturday = new Date(thisWeekSunday)
  lastWeekSaturday.setDate(thisWeekSunday.getDate() - 1)

  const format = (d) => formatDate(d)

  return {
    startDate: format(lastWeekSunday),
    endDate: format(lastWeekSaturday)
  }
}

// period 값에 따라 조회할 날짜 범위를 반환
function getDateRangeByPeriod(period, sales = []) {
  const format = (d) => formatDate(d)

  if (period === 'today') {
    const today = getToday()

    return {
      startDate: today,
      endDate: today
    }
  }

  if (period === 'this_week') {
    return getThisWeekRange()
  }

  if (period === 'last_week') {
    return getLastWeekRange()
  }

  if (period === 'recent_7_days') {
    const end = new Date()
    const start = new Date()

    start.setDate(end.getDate() - 6)

    return {
      startDate: format(start),
      endDate: format(end)
    }
  }

  if (period === 'all' || !period) {
    const sorted = [...sales].sort((a, b) => a.date.localeCompare(b.date))

    return {
      startDate: sorted[0]?.date,
      endDate: sorted[sorted.length - 1]?.date
    }
  }

  return null
}

// 최근 n일(기본 7일) 매출 평균 계산
function getAverage(sales, days = 7) {
  const recent = sales.slice(-days)

  const total = recent.reduce((sum, item) => {
    const dailySales = Number(String(item.dailySales).replaceAll(',', '')) || 0
    return sum + dailySales
  }, 0)

  if (recent.length === 0) return 0

  return Math.floor(total / recent.length)
}

// 매출이 가장 높은 날짜 데이터를 반환
function getMaxSalesDay(sales) {
  const sorted = [...sales].sort((a, b) => {
    const aSales = Number(String(a.dailySales).replaceAll(',', '')) || 0
    const bSales = Number(String(b.dailySales).replaceAll(',', '')) || 0

    return bSales - aSales
  })

  return sorted[0]
}

// 특정 날짜 범위(startDate ~ endDate)의 총 매출 계산
function getSalesTotalByRange(sales, startDate, endDate) {

  const filtered = sales.filter(item =>
    item.date >= startDate && item.date <= endDate
  )

  return filtered.reduce((sum, item) => {
    const dailySales =
      Number(String(item.dailySales).replaceAll(',', '')) || 0

    console.log(item.date, dailySales)

    return sum + dailySales
  }, 0)
}


// 특정 기간의 베스트 메뉴 조회
// 특정 기간의 메뉴 조회
// sort가 desc면 잘 팔린 메뉴, asc면 판매 저조 메뉴
function getBestMenuByRange(sales, startDate, endDate, menuCategoryMap, menuType = 'all_food', sort = 'desc') {
  const filteredSales = sales.filter(item =>
    item.date >= startDate && item.date <= endDate
  )

  const allDetails = filteredSales
    .flatMap(item => item.details || [])
    .filter(item => {
      const category = menuCategoryMap[item.name]

      if (!category) return false

      if (menuType === 'side') {
        return category === '사이드'
      }

      if (menuType === 'main') {
        return category !== '음료' && category !== '사이드'
      }

      return category !== '음료'
    })

  const menuMap = {}

  allDetails.forEach(item => {
    const name = item.name
    const count = Number(item.count) || 0

    menuMap[name] = (menuMap[name] || 0) + count
  })

  const sortedMenus = Object.entries(menuMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (sort === 'asc') {
        return a.count - b.count
      }

      return b.count - a.count
    })

  return sortedMenus[0] || null
}


// 기간별 매출 합계 응답 생성
function getSalesTotalResponse(sales, period, type) {
  const range = getDateRangeByPeriod(period, sales)

  if (!range?.startDate || !range?.endDate) {
    return {
      type,
      message: '기간 정보를 확인할 수 없습니다.'
    }
  }

  const totalSales = getSalesTotalByRange(
    sales,
    range.startDate,
    range.endDate
  )

  return {
    type,
    period,
    startDate: range.startDate,
    endDate: range.endDate,
    totalSales
  }
}


function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// ---------------------------------------------------------------------------
// LLM이 선택한 toolName에 따라 실제 데이터 처리 실행
// ---------------------------------------------------------------------------



export async function runSalesTool(toolName, params) {
  const { ownerId, storeId } = params

  const sales = await getSales(ownerId, storeId)
  const menus = await getMenus(ownerId, storeId)

  // 오늘 매출 조회
  if (toolName === 'get_today_sales') {
    return {
      type: 'today_sales',
      todaySales: getTodaySales(sales)
    }
  }

  // 이번 주 매출 합계 조회
  if (toolName === 'get_this_week_sales') {
    return getSalesTotalResponse(
      sales,
      'this_week',
      'this_week_sales'
    )
  }

  // 지난 주 매출 합계 조회
  if (toolName === 'get_last_week_sales') {
    return getSalesTotalResponse(
      sales,
      'last_week',
      'last_week_sales'
    )
  }

  // 이번 주 vs 지난 주 매출 비교
  if (toolName === 'compare_this_week_last_week') {
    const thisWeekRange = getDateRangeByPeriod('this_week', sales)
    const lastWeekRange = getDateRangeByPeriod('last_week', sales)

    const thisWeekSales = getSalesTotalByRange(
      sales,
      thisWeekRange.startDate,
      thisWeekRange.endDate
    )

    const lastWeekSales = getSalesTotalByRange(
      sales,
      lastWeekRange.startDate,
      lastWeekRange.endDate
    )

    return {
      type: 'sales_compare',
      thisWeek: {
        startDate: thisWeekRange.startDate,
        endDate: thisWeekRange.endDate,
        totalSales: thisWeekSales
      },
      lastWeek: {
        startDate: lastWeekRange.startDate,
        endDate: lastWeekRange.endDate,
        totalSales: lastWeekSales
      },
      difference: thisWeekSales - lastWeekSales
    }
  }

  // 최근 평균 매출 조회
  if (toolName === 'get_average_sales') {
    return {
      type: 'average_sales',
      days: 7,
      averageSales: getAverage(sales, 7)
    }
  }

  // 최고 매출 날짜 조회
  if (toolName === 'get_best_sales_day') {
    const max = getMaxSalesDay(sales)

    if (!max) {
      return {
        type: 'best_sales_day',
        message: '매출 데이터가 없습니다.'
      }
    }

    return {
      type: 'best_sales_day',
      date: max.date,
      dailySales: Number(String(max.dailySales).replaceAll(',', '')) || 0
    }
  }

  // 잘 팔린 메뉴 / 판매 저조 메뉴 조회
  if (toolName === 'get_best_menu' || toolName === 'get_worst_menu') {
    const period = params.period || 'all'
    const menuType = params.menuType || 'all_food'
    const sort = toolName === 'get_worst_menu' ? 'asc' : 'desc'

    const range = getDateRangeByPeriod(period, sales)

    const menuCategoryMap = {}

    menus.forEach(menu => {
      menuCategoryMap[menu.name] = menu.category
    })

    if (!range?.startDate || !range?.endDate) {
      return {
        type: toolName === 'get_worst_menu' ? 'worst_menu' : 'best_menu',
        message: '기간 정보를 확인할 수 없습니다.'
      }
    }

    const menu = getBestMenuByRange(
      sales,
      range.startDate,
      range.endDate,
      menuCategoryMap,
      menuType,
      sort
    )

    return {
      type: toolName === 'get_worst_menu' ? 'worst_menu' : 'best_menu',
      period,
      menuType,
      startDate: range.startDate,
      endDate: range.endDate,
      menu
    }
  }

  return null
}