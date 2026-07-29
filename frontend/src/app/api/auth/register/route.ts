import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/normalizeEmail';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'すべての必須項目を入力してください' }, { status: 400 });
    }

    // backend（iOS向けAPI）と同じ正規化を通さないと、同じアドレスで
    // 別アカウントが作られたり、iOSからログインできなくなる。
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'このメールアドレスは既に登録されています' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        plan: "FREE",
        points: 0,
        rank: "ブロンズ",
      },
    });

    return NextResponse.json({ message: '登録が完了しました', user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: '登録中にエラーが発生しました' }, { status: 500 });
  }
}