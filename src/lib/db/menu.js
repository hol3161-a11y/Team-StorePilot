import clientPromise from '@/lib/mongodb'

export async function getMenus(ownerId) {
    const client = await clientPromise;
    const db = client.db('store_pilot');

    const menuCol = db.collection('menu');
    const saleCol = db.collection('sale');

    // 1. menu 가져오기
    const menuDoc = await menuCol.findOne({ ownerId });
    console.log('[getMenus] menuDoc:', menuDoc);
    if (!menuDoc) return [];

    const menu = menuDoc.menu || [];


    // 2. sale 가져오기
    const saleDoc = await saleCol.findOne({ ownerId });
    const salesData = saleDoc?.sales || [];

    // 30일 필터
    const now = new Date();
    const days30Ago = new Date();
    days30Ago.setDate(now.getDate() - 30);

    const filteredSales = salesData.filter(day => {
        // console.log(day.date)
        return new Date(day.date) >= days30Ago;
    });

    // 3. salesMap 만들기
    const salesMap = {};

    filteredSales.forEach(day => {
        (day.details || []).forEach(item => {
            const name = item.name;
            const count = Number(item.count) || 0;

            salesMap[name] = (salesMap[name] || 0) + count;
        });
    });

    // 4. menu에 sales 붙이기
    const menuWithSales = menu.map(item => ({
        ...item,
        sales: salesMap[item.name] || 0
    }));
    //console.log("전체:", salesData.length);
    //onsole.log("30일:", filteredSales.length);

    return menuWithSales;
}