import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      ownerEmail,
      storeName,
      industry,
      customIndustry,
      address,
      detailAddress,
    } = body ?? {};

    if (!ownerEmail || !storeName?.trim() || !address?.trim()) {
      return Response.json(
        { ok: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const collection = client.db('store_pilot').collection('store');

    const now = new Date();
    await collection.updateOne(
      { ownerEmail },
      {
        $set: {
          storeName: storeName.trim(),
          industry: industry ?? 'restaurant',
          customIndustry: industry === 'other' ? (customIndustry ?? '').trim() : '',
          address: address.trim(),
          detailAddress: (detailAddress ?? '').trim(),
          updatedAt: now,
        },
        $setOnInsert: { ownerEmail, createdAt: now },
      },
      { upsert: true }
    );

    return Response.json({ ok: true });
  } catch (e) {
    console.error('[/api/store] POST failed', e);
    return Response.json(
      { ok: false, error: '저장 중 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
