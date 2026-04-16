import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const memo = await prisma.memo.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    return NextResponse.json(memo);
  } catch (error) {
    console.error(`API Error: GET /memos/[id]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Check ownership
    const existingMemo = await prisma.memo.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingMemo) {
      return NextResponse.json({ error: 'Memo not found or unauthorized' }, { status: 404 });
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

    const updatedMemo = await prisma.memo.update({
      where: { id: id },
      data: {
        title: title !== undefined ? title : existingMemo.title,
        content: content !== undefined ? content : existingMemo.content,
        status: status !== undefined ? status : existingMemo.status,
        topicId: topicId !== undefined ? topicId : existingMemo.topicId
      }
    });

    return NextResponse.json(updatedMemo);
  } catch (error) {
    console.error(`API Error: PUT /memos/[id]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existingMemo = await prisma.memo.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingMemo) {
      return NextResponse.json({ error: 'Memo not found or unauthorized' }, { status: 404 });
    }

    await prisma.memo.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`API Error: DELETE /memos/[id]`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
