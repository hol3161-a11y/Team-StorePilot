import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  const body = await request.json();
  const client = await clientPromise;
  const account = await client
    .db('store_pilot')
    .collection('account')
    .findOne({ id: body.email });

  if (account && account.password && account.password === body.password) {
    return Response.json({ ok: true, name: account.name ?? '' });
  }
  return Response.json({ ok: false });
}
