import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOption } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { getSales, deleteSales, postSales } from '@/lib/db/sales'

async function getCollection() {
  const client = await clientPromise;
  return client.db('store_pilot').collection('sale');
};

export async function GET() {
  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email

  const sales = await getSales(ownerId)
  return NextResponse.json({ sales });
};

export async function POST(request) {
  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email

  const { date, day, dailySales, details } = await request.json()
  await postSales(ownerId, date, day, dailySales, details);
  return NextResponse.json({ ok: true })
}

export async function PUT(request) {
  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email

  const { date, day, dailySales, details } = await request.json()
  const col = await getCollection()

  await col.updateOne(
    { ownerId, 'sales.date': date },
    { $set: { 'sales.$': { date, day, dailySales, details } } }
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(request) {
  const session = await getServerSession(authOption)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ownerId = session.user.email

  const { searchParams } = new URL(request.url);
  const datesParam = searchParams.get('dates');

  try {
    await deleteSales(ownerId, datesParam);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.message === 'dates required')
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
