// src/lib/utils/employeeCalc.js

function parseEmployeeDays(employeeDays) {
  const daysText = String(employeeDays || '').replace(/\s/g, '')

  if (!daysText) return []

  if (daysText.includes('평일')) return ['월', '화', '수', '목', '금']
  if (daysText.includes('주말')) return ['토', '일']

  return daysText
    .split(/[\/,·]/)
    .map(day => day.trim())
    .filter(Boolean)
}

export function isEmployeeWorkingDay(employeeDays, date) {
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

export function getWorkHours(startTime, endTime) {
  if (!startTime || !endTime) return 0

  const [startHour, startMinute] = String(startTime).split(':').map(Number)
  const [endHour, endMinute] = String(endTime).split(':').map(Number)

  const start = startHour + startMinute / 60
  const end = endHour + endMinute / 60

  return Math.max(end - start, 0)
}

export function getTodayWorkingEmployees(employees, today) {
  if (!Array.isArray(employees)) return []

  return employees.filter(employee =>
    isEmployeeWorkingDay(employee.days, today)
  )
}

export function getTodayLaborCost(employees, today) {
  const todayWorkingEmployees = getTodayWorkingEmployees(employees, today)

  return todayWorkingEmployees.reduce((sum, employee) => {
    const workHours = getWorkHours(employee.startTime, employee.endTime)
    const wage = Number(employee.hourlyWage || 0)

    return sum + workHours * wage
  }, 0)
}