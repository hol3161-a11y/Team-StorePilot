import clientPromise from '@/lib/mongodb'

async function getCollection() {
    const client = await clientPromise;
    return await client.db('store_pilot').collection('employee');
}

export async function getEmployee(ownerId) {
    const col = await getCollection();

    // 🔥 여러 문서 가져오기
    const docs = await col.findOne({ ownerId });

    if (!docs) return [];
    return docs.employees || [];
}