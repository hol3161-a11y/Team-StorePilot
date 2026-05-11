import clientPromise from '@/lib/mongodb'

async function getCollection() {
    const client = await clientPromise;
    return client.db('store_pilot').collection('stock');
}

export async function getStock(ownerId) {
    const col = await getCollection();
    const doc = await col.findOne({ ownerId });

    if (!doc) return [];

    return doc.stocks || [];
};