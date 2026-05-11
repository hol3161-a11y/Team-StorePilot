import { getEmployee } from '@/lib/db/employee'

// 오늘 날짜 - 한국 시간 기준
function getTodayDate() {
  const now = new Date()
  const koreaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  )

  koreaTime.setHours(0, 0, 0, 0)
  return koreaTime
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 기간별 날짜 범위
function getDateRangeByPeriod(period, month, day) {
  const today = getTodayDate()
  const year = today.getFullYear()

  if (period === 'date' && month && day) {
    const targetDate = new Date(year, month - 1, day)

    return {
      startDate: formatDate(targetDate),
      endDate: formatDate(targetDate)
    }
  }

  if (period === 'today') {
    return {
      startDate: formatDate(today),
      endDate: formatDate(today)
    }
  }

  if (period === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    return {
      startDate: formatDate(yesterday),
      endDate: formatDate(yesterday)
    }
  }

  if (period === 'tomorrow') {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    return {
      startDate: formatDate(tomorrow),
      endDate: formatDate(tomorrow)
    }
  }

  if (period === 'this_week') {
    const currentDay = today.getDay()
    const start = new Date(today)
    start.setDate(today.getDate() - currentDay)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    }
  }

  if (period === 'last_week') {
    const currentDay = today.getDay()
    const start = new Date(today)
    start.setDate(today.getDate() - currentDay - 7)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    }
  }

  if (period === 'this_month') {
    const start = new Date(year, today.getMonth(), 1)
    const end = new Date(year, today.getMonth() + 1, 0)

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    }
  }

  if (period === 'last_month') {
    const start = new Date(year, today.getMonth() - 1, 1)
    const end = new Date(year, today.getMonth(), 0)

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    }
  }

  if (period === 'month' && month) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    }
  }

  return null
}

// 날짜 범위 안의 모든 날짜 만들기
function getDatesBetween(startDate, endDate) {
  const dates = []

  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

// 요일 텍스트를 배열로 변환
function parseEmployeeDays(employeeDays) {
  const daysText = String(employeeDays || '').replace(/\s/g, '')

  if (!daysText) return []

  if (daysText.includes('평일')) {
    return ['월', '화', '수', '목', '금']
  }

  if (daysText.includes('주말')) {
    return ['토', '일']
  }

  if (
    daysText.includes('월~금') ||
    daysText.includes('월-금') ||
    daysText.includes('월부터금까지')
  ) {
    return ['월', '화', '수', '목', '금']
  }

  if (
    daysText.includes('월~토') ||
    daysText.includes('월-토')
  ) {
    return ['월', '화', '수', '목', '금', '토']
  }

  return daysText
    .split(/[\/,·]/)
    .map(day => day.trim())
    .filter(Boolean)
}

// 직원이 해당 날짜에 근무하는지 확인
function isEmployeeWorkingDay(employeeDays, date) {
  const dayMap = {
    0: '일',
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토'
  }

  const koreanDay = dayMap[date.getDay()]
  const workingDays = parseEmployeeDays(employeeDays)

  return workingDays.includes(koreanDay)
}

// 근무시간 계산 - startTime, endTime 기준
function getWorkHours(startTime, endTime) {
  if (!startTime || !endTime) return 0

  const [startHour, startMinute] = String(startTime).split(':').map(Number)
  const [endHour, endMinute] = String(endTime).split(':').map(Number)

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0
  }

  const start = startHour + startMinute / 60
  const end = endHour + endMinute / 60

  return Math.max(end - start, 0)
}

// 인건비 계산
function getLaborCost(employees, period, month, day) {
  if (!Array.isArray(employees)) return null

  const range = getDateRangeByPeriod(period, month, day)

  if (!range) return null

  const dates = getDatesBetween(range.startDate, range.endDate)

  const employeeCosts = employees
    .filter(employee => Number(employee.hourlyWage) > 0)
    .map(employee => {
      const workHoursPerDay = getWorkHours(
        employee.startTime,
        employee.endTime
      )

      const workDates = dates.filter(date =>
        isEmployeeWorkingDay(employee.days, date)
      )

      const totalHours = workDates.length * workHoursPerDay
      const totalCost = totalHours * Number(employee.hourlyWage)

      return {
        name: employee.name,
        part: employee.part || '미지정',
        hourlyWage: Number(employee.hourlyWage),
        days: employee.days,
        startTime: employee.startTime,
        endTime: employee.endTime,
        workDays: workDates.length,
        workHoursPerDay,
        totalHours,
        totalCost
      }
    })
    .filter(employee => employee.workDays > 0)

  const totalLaborCost = employeeCosts.reduce((sum, item) => {
    return sum + item.totalCost
  }, 0)

  return {
    type: 'labor_cost',
    period,
    month,
    day,
    startDate: range.startDate,
    endDate: range.endDate,
    totalLaborCost,
    employees: employeeCosts
  }
}

// 근무 인원 조회
function getWorkingEmployees(employees, period, month, day) {
  if (!Array.isArray(employees)) return null

  const range = getDateRangeByPeriod(period, month, day)

  if (!range) return null

  const dates = getDatesBetween(range.startDate, range.endDate)

  const workingEmployees = employees
    .map(employee => {
      const workDates = dates.filter(date =>
        isEmployeeWorkingDay(employee.days, date)
      )

      if (workDates.length === 0) return null

      return {
        name: employee.name,
        age: employee.age,
        part: employee.part || '미지정',
        days: employee.days,
        startTime: employee.startTime,
        endTime: employee.endTime,
        phone: employee.phone,
        workDays: workDates.length,
        workDates: workDates.map(date => formatDate(date))
      }
    })
    .filter(Boolean)

  return {
    type: 'working_employees',
    period,
    month,
    day,
    startDate: range.startDate,
    endDate: range.endDate,
    totalCount: workingEmployees.length,
    employees: workingEmployees
  }
}

export async function runEmployeeTool(toolName, params) {
  const { ownerId, storeId, period, month, day } = params

  const employees = await getEmployee(ownerId, storeId)

  console.log('employees:::::::::::::::', employees)
  console.log('params::::::::::::::::', params)

  if (!employees || employees.length === 0) {
    return {
      type: toolName,
      message: '직원 데이터가 없습니다.'
    }
  }

  if (toolName === 'get_labor_cost') {
    return getLaborCost(employees, period, month, day)
  }

  if (toolName === 'get_working_employees') {
    return getWorkingEmployees(employees, period, month, day)
  }

  return null
}