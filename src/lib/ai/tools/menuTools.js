import { getMenus } from '@/lib/db/menu'

// 품절 메뉴 조회
function getSoldOut(menu) {

    if (!Array.isArray(menu)) return null

    return menu
        .filter(item => item.status == "품절")
        .map(item => ({
            name: item.name,
            status: item.status
        }))
}


// ---------------------------------------------------------------------------
// LLM이 선택한 toolName에 따라 실제 데이터 처리 실행
// ---------------------------------------------------------------------------

export async function runMenuTool(toolName, params) {
    const { ownerId, storeId } = params

    const menu = await getMenus(ownerId, storeId)

    // 품절 메뉴 조회
    if (toolName === 'get_soldout_menu') {

        const soldOutMenu = getSoldOut(menu)

        return {
            type: 'soldout_menu',
            soldOutMenu
        }
    }


    return null
}