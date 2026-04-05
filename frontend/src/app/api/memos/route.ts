import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memos = await prisma.memo.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        topic: true
      }
    });

    return NextResponse.json(memos);
  } catch (error) {
    console.error('API Error: GET /memos', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, status, topicId } = await request.json();

    const memo = await prisma.memo.create({
      data: {
        title: title || '無題のメモ',
        content: content || '',
        status: status || 'DRAFT',
        userId: session.user.id,
        topicId: topicId || null,
      },
    });

    return NextResponse.json(memo, { status: 201 });
  } catch (error) {
    console.error('API Error: POST /memos', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
