import clientPromise from '@/lib/mongodb'
import { getEmployee } from '@/lib/db/employee'
import { randomUUID } from 'crypto'; 
import { ObjectId } from 'mongodb';

// ✅ GET
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const storeId = searchParams.get('storeId');

    const employees = await getEmployee(ownerId, storeId);

    return Response.json({ employees });
}


// ✅ POST (추가)
export async function POST(request) {
    const body = await request.json();
    console.log(body);
    
    const client = await clientPromise;
    const db = client.db('store_pilot');

    const findData = await db.collection('employee').find({ownerId:body.ownerId}).toArray();
console.log(findData);

    if(!findData.length){
        await db.collection('employee').insertOne({...body,employees:[body.employees]});
    }
    else{
        await db.collection('employee').updateOne(
            { ownerId : body.ownerId },
            { $push: { employees: body.employees } },
            { upsert: true } // 🔥 없으면 추가 안 됨
        );
    }

    return Response.json({ state:'성공' });
    

}


// ✅ PUT (수정, 삭제)
export async function PUT(request) {
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db('store_pilot');

    const result = await db.collection('employee').updateOne(
        {ownerId: body.ownerId},
        {
            $set: {employees: body.employees}
        }
    );

    return Response.json({
        message: '수정 완료',
        result
    });
}

