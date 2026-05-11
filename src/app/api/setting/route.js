import { getServerSession } from "next-auth";
import { authOption } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    const session = await getServerSession(authOption);

    if (!session?.user?.email) {
        return Response.json(
            { error: "세션 없음" },
            { status: 401 }
        );
    }

    const email = session.user.email;

    const client = await clientPromise;
    const db = client.db("store_pilot");

    const account = await db.collection("account").findOne(
        { id: email },
        { projection: { password: 0 } }
    );

    const store = await db.collection("store").findOne(
        { ownerId: email }
    );

    return Response.json({
        account: account
            ? {
                ...account,
                _id: account._id.toString(),
            }
            : null,

        store: store
            ? {
                ...store,
                _id: store._id.toString(),
            }
            : null,
    });
}

export async function PATCH(request) {
    const session = await getServerSession(authOption);

    if (!session?.user?.email) {
        return Response.json(
            { error: "세션 없음" },
            { status: 401 }
        );
    }

    const { name, address } = await request.json();

    if (!name || !address) {
        return Response.json(
            { error: "매장 이름과 주소를 입력해주세요" },
            { status: 400 }
        );
    }

    const client = await clientPromise;
    const db = client.db("store_pilot");

    const result = await db.collection("store").findOneAndUpdate(
        { ownerId: session.user.email },
        {
            $set: {
                name,
                address,
                updatedAt: new Date()
            }
        },
        { returnDocument: "after" }
    );

    if (!result) {
        return Response.json(
            { error: "매장 없음" },
            { status: 404 }
        );
    }

    return Response.json({
        store: {
            ...result,
            _id: result._id.toString()
        }
    });
}

export async function DELETE() {
    const session = await getServerSession(authOption);

    if (!session?.user?.email) {
        return Response.json(
            { error: "세션 없음" },
            { status: 401 }
        );
    }

    const email = session.user.email;

    const client = await clientPromise;
    const db = client.db("store_pilot");

    // account 삭제
    await db.collection("account").deleteOne({
        id: email
    });

    // store 삭제
    await db.collection("store").deleteOne({
        ownerId: email
    });

    return Response.json({
        success: true
    });
}