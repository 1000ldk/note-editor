export interface Draft {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  lastSaved: Date;
  wordCount: number;
}

export type AppView = 'drafts' | 'published' | 'archive' | 'memos';