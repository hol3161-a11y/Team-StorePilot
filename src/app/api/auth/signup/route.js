import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // 1. 빈 칸 체크
    if (!email || !password) {
      return Response.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 2. MongoDB 연결
    const client = await clientPromise;
    const collection = client.db('store_pilot').collection('account');

    // 3. 이메일 중복 체크
    const existing = await collection.findOne({ id: email });
    if (existing) {
      return Response.json(
        { error: '이미 가입된 이메일입니다' },
        { status: 400 }
      );
    }

    // 4. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. DB에 저장
    await collection.insertOne({
      id: email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      provider: 'email',
      createdAt: new Date()
    });

    return Response.json({
      success: true,
      message: '회원가입 성공!'
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    return Response.json(
      { error: '회원가입 실패' },
      { status: 500 }
    );
  }
}
