import { NextResponse } from 'next/server';

const ALLOWED_MEMO_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export type MemoStatus = (typeof ALLOWED_MEMO_STATUSES)[number];

export interface MemoInput {
  title?: unknown;
  content?: unknown;
  status?: unknown;
}

/**
 * Validates memo input fields (title, content, status).
 * Returns a 400 NextResponse if any field is invalid, or null if all are valid.
 */
export function validateMemoInput({ title, content, status }: MemoInput): NextResponse | null {
  if (status !== undefined && !ALLOWED_MEMO_STATUSES.includes(status as MemoStatus)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }
  if (title !== undefined && typeof title !== 'string') {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
  }
  if (content !== undefined && typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }
  return null;
}
