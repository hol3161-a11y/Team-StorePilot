import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import NaverProvider from 'next-auth/providers/naver';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcrypt';

export const authOption = {
  providers: [
    // 구글 로그인
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // 네이버 로그인 (기존)
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      // 기본 매핑은 nickname을 name으로 넣기 때문에 실명(response.name)을 우선 사용
      profile(profile) {
        const r = profile.response;
        return {
          id: r.id,
          name: r.name || r.nickname || (r.email ? r.email.split('@')[0] : ''),
          email: r.email,
          image: r.profile_image,
        };
      },
    }),
    
    // 이메일 로그인 (새로 추가)
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 1. DB 연결
          const client = await clientPromise;
          const collection = client.db('store_pilot').collection('account');

          // 2. 이메일로 사용자 찾기
          const user = await collection.findOne({ id: credentials.email });
          
          if (!user) {
            throw new Error('가입되지 않은 이메일입니다. 하단의 회원가입을 진행해주세요');
          }

          if (!user.password) {
            throw new Error('소셜 로그인으로 가입된 계정입니다. 구글 또는 네이버로 로그인해주세요');
          }

          // 3. 비밀번호 확인
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            throw new Error('비밀번호가 틀렸습니다');
          }
          
          // 4. 로그인 성공
          return {
            id: user.id,
            email: user.id,
            name: user.name || user.id.split('@')[0]
          };
          
        } catch (error) {
          console.error('로그인 에러:', error);
          throw new Error(error.message);
        }
      }
    })
  ],
  
  callbacks: {
    // 소셜 로그인: 쿠키로 전달된 의도(login/signup)에 따라 분기
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'naver') {
        if (!user.email) return false;

        const cookieStore = await cookies();
        const intent = cookieStore.get('auth_intent')?.value;

        const client = await clientPromise;
        const collection = client.db('store_pilot').collection('account');
        const existing = await collection.findOne({ id: user.email });

        console.log('[signIn]', { provider: account.provider, email: user.email, intent, existing: !!existing });

        // 로그인 시도인데 가입 이력 없음 → 자동 가입 처리 후 welcome으로
        if (intent === 'login' && !existing) {
          await collection.insertOne({
            id: user.email,
            name: user.name || user.email.split('@')[0],
            provider: account.provider,
            createdAt: new Date(),
          });
          return `/welcome?name=${encodeURIComponent(user.name || '')}`;
        }

        // 회원가입 시도인데 이미 가입됨 → 거부
        if (intent === 'signup' && existing) {
          return '/signup?error=AlreadyRegistered';
        }

        // 회원가입 시도이고 신규 → 계정 생성
        if (intent === 'signup' && !existing) {
          await collection.insertOne({
            id: user.email,
            name: user.name || user.email.split('@')[0],
            provider: account.provider,
            createdAt: new Date(),
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOption);

export { handler as GET, handler as POST };
