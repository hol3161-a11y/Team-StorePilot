import clientPromise from '@/lib/mongodb'

async function getCollection() {
    const client = await clientPromise;
    return client.db('store_pilot').collection('sale');
}

export async function getSales(ownerId) {
    const col = await getCollection();
    const doc = await col.findOne({ ownerId });

    if (!doc) return [];

    return doc.sales || [];
};

export async function deleteSales(ownerId, datesParam) {
    const dates = datesParam ? datesParam.split(',') : [];
    if (dates.length === 0)
        throw new Error('dates required');

    const col = await getCollection();

    await col.updateOne(
        { ownerId },
        { $pull: { sales: { date: { $in: dates } } } }
    );
};

export async function postSales(ownerId, date, day, dailySales, details) {
    const col = await getCollection();

    // 같은 날짜의 매출 기록이 이미 존재하는지 확인
    const doc = await col.findOne({ ownerId, 'sales.date': date });

    if (doc) {
        // ── 같은 날짜가 이미 있을 때 (ex. 하루에 주문이 두 번 들어온 경우) ──

        // 기존 해당 날짜 항목 추출
        const existing = doc.sales.find(s => s.date === date);

        // 기존 details 배열을 복사해서 병합 작업에 사용
        const mergedDetails = [...(existing.details ?? [])];

        for (const newItem of (details ?? [])) {
            // 이미 같은 메뉴명이 있으면 수량·금액 누적
            const found = mergedDetails.find(d => d.name === newItem.name);
            if (found) {
                found.count = Number(found.count) + Number(newItem.count);
                found.sales = Number(found.sales) + Number(newItem.sales);
            } else {
                // 새로운 메뉴면 배열에 추가
                mergedDetails.push(newItem);
            }
        }

        // sales 배열에서 해당 날짜 항목($)을 병합된 값으로 교체
        // dailySales는 기존 + 새 주문 금액 합산
        await col.updateOne(
            { ownerId, 'sales.date': date },
            { $set: { 'sales.$': { date, day, dailySales: Number(existing.dailySales) + Number(dailySales), details: mergedDetails } } }
        );
    } else {
        // ── 해당 날짜 기록이 없을 때 → 새 항목 추가 ──
        // upsert: true → 매장 문서 자체가 없으면 새로 생성
        await col.updateOne(
            { ownerId },
            { $push: { sales: { date, day, dailySales, details: details ?? [] } } },
            { upsert: true }
        );
    }
};
