export interface LocalApplicationDraft {
  userId: string;
  position: string;
  answers: Record<string, string>;
  updatedAt: number;
}

const draftKey = (userId: string) => `sacApplicationDraft:${userId}`;
const LEGACY_DRAFT_KEY = 'applicationProgress';

const isAnswerMap = (value: unknown): value is Record<string, string> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const parseDraft = (raw: string | null, userId: string): LocalApplicationDraft | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalApplicationDraft> & {
      answers?: unknown;
      position?: unknown;
    };

    if (!isAnswerMap(parsed.answers)) return null;

    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.answers)) {
      if (typeof value === 'string') {
        answers[key] = value;
      }
    }

    return {
      userId,
      position: typeof parsed.position === 'string' ? parsed.position : '',
      answers,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
};

export const countAnsweredQuestions = (answers: Record<string, string> | undefined): number => {
  if (!answers) return 0;
  return Object.values(answers).filter((value) => value.trim() !== '').length;
};

export const mergeApplicationAnswers = (
  serverAnswers: Record<string, string> | undefined,
  localAnswers: Record<string, string> | undefined
): Record<string, string> => {
  const merged: Record<string, string> = { ...(serverAnswers || {}) };

  for (const [key, value] of Object.entries(localAnswers || {})) {
    if (typeof value !== 'string' || value.trim() === '') continue;
    const serverText = (merged[key] || '').trim();
    if (value.trim().length >= serverText.length) {
      merged[key] = value;
    }
  }

  return merged;
};

export const loadLocalApplicationDraft = (userId: string): LocalApplicationDraft | null => {
  try {
    const draft = parseDraft(localStorage.getItem(draftKey(userId)), userId);
    if (draft) return draft;
    return parseDraft(localStorage.getItem(LEGACY_DRAFT_KEY), userId);
  } catch {
    return null;
  }
};

export const saveLocalApplicationDraft = (
  userId: string,
  position: string,
  answers: Record<string, string>
): void => {
  try {
    const draft: LocalApplicationDraft = {
      userId,
      position,
      answers,
      updatedAt: Date.now(),
    };
    localStorage.setItem(draftKey(userId), JSON.stringify(draft));
  } catch {
    // Storage can be full or blocked; Firestore remains the source of truth.
  }
};

export const clearLocalApplicationDraft = (userId: string): void => {
  try {
    localStorage.removeItem(draftKey(userId));
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // Ignore storage failures on logout/reset.
  }
};
