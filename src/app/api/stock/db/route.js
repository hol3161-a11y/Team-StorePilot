import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getStock } from '@/lib/db/stock';
import { getServerSession } from 'next-auth';
import { authOption } from '../../auth/[...nextauth]/route';

/* 재고 목록 조회 */
export async function GET(request) {
  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email

  const stocks = await getStock(ownerId);
  return Response.json({ stocks });
}

/* 재고 추가 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { ownerId, productName, quantity, expirationDate } = body;

    if (!ownerId) {
      return Response.json(
        { success: false, error: 'ownerId가 필요합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const col = client.db('store_pilot').collection('stock');

    const newId = new ObjectId();
    await col.updateOne(
      { ownerId },
      {
        $push: {
          stocks: {
            _id: newId,
            productName,
            quantity,
            expirationDate,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true }
    );

    return Response.json({ success: true, id: newId.toString() });
  } catch (err) {
    console.error('[/api/stock] POST failed', err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/* 재고 삭제 */
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { ownerId, ids } = body;

    const client = await clientPromise;
    const col = client.db('store_pilot').collection('stock');

    await col.updateOne(
      { ownerId },
      {
        $pull: {
          stocks: {
            _id: { $in: ids.map((id) => new ObjectId(id)) },
          },
        },
      }
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error('[/api/stock] DELETE failed', err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
