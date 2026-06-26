import clientPromise from '@/lib/mongodb'

export async function POST(request) {
    const body = await request.json();
    const client = await clientPromise;
    const existing = await client.db('store_pilot').collection('account').findOne({ id: body.email });

    if (!existing) {
        await client.db('store_pilot').collection('account').insertOne({
            id: body.email,
            name: body.name ?? null,
            password: body.password ?? null,
            provider: body.provider ?? 'local',
        });
        return Response.json({ result: null });
    } else {
        return Response.json({ result: 'a' });
    }
};
