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
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        updatedAt: true,
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

    const ALLOWED_STATUSES = ['DRAFT', 'PUBLISHED'];
    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    if (title !== undefined && typeof title !== 'string') {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }
    if (content !== undefined && typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

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
