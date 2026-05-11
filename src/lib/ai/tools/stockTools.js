// 재고 tools

import { getStock } from '@/lib/db/stock'



// 오늘 날짜를 YYYY-MM-DD 형태로 반환
function getToday() {
    const today = new Date()
    return today.toISOString().slice(0, 10)
}


// 부족재고 조회
function getCautionStock(stock, threshold = 5) {

    if (!Array.isArray(stock)) return []

    return stock
        .filter(item => Number(item.quantity) < threshold)
        .map(item => ({
            name: item.name,
            quantity: Number(item.quantity),
            unit: item.unit
        }))
}


// 폐기임박 유통기한 조회 (3일 이내)
function getDangerStock(stock, days = 3) {
    if (!Array.isArray(stock)) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const limit = new Date(today)
    limit.setDate(today.getDate() + days)

    return stock
        .filter(item => {
            const exp = new Date(item.expirationDate)
            exp.setHours(0, 0, 0, 0)

            return exp >= today && exp <= limit
        })
        .map(item => ({
            name: item.name,
            expirationDate: item.expirationDate
        }))
}

function normalizeName(value) {
    return String(value || '')
        .replace(/\s/g, '')
        .replace(/\(.*?\)/g, '')
        .toLowerCase()
}

// 특정 재고 수량 조회
function getStockQuantity(stock, stockName) {

    if (!Array.isArray(stock)) return null
    if (!stockName) return null
    
    const targetName = normalizeName(stockName)
    
    const found = stock.find(item => {
        const itemName = normalizeName(item.name)
        return itemName.includes(targetName) || targetName.includes(itemName)
    })

    if (!found) return null

    return {
        name: found.name,
        quantity: Number(found.quantity) || 0,
        unit: found.unit
    }
}

// 발주 추천(?)

// ---------------------------------------------------------------------------
// LLM이 선택한 toolName에 따라 실제 데이터 처리 실행
// ---------------------------------------------------------------------------



export async function runStockTool(toolName, params) {
    const { ownerId, storeId, stockName } = params

    const stock = await getStock(ownerId, storeId)

    // 부족 재고 조회
    if (toolName === 'get_caution_stock') {
        if (!stock || stock.length === 0) {
            return {
                type: 'caution_stock',
                message: '데이터가 없습니다.'
            }
        }

        const cautionStock = getCautionStock(stock)

        return {
            type: 'caution_stock',
            cautionStock
        }
    }

    // 유통기한 폐기 임박
    if (toolName === 'get_danger_stock') {

        const dangerStock = getDangerStock(stock)

        return {
            type: 'danger_stock',
            dangerStock
        }
    }

    // 특정 재고 조회
    if (toolName === 'get_stock_quantity') {

        const stockQuantity = getStockQuantity(stock,stockName)

        return {
            type: 'stock_quantity',
            stockQuantity
        }
    }


    return null
}