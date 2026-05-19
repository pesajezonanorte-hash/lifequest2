export type QuestType = 'MAIN' | 'SIDE' | 'DAILY' | 'WEEKLY' | 'META';
export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
export type QuestDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EPIC';
export type QuestCategory =
  | 'HEALTH'
  | 'FITNESS'
  | 'FINANCE'
  | 'LEARNING'
  | 'LOVE'
  | 'SOCIAL'
  | 'PERSONAL'
  | 'CREATIVE';

export interface SubObjective {
  id: string;
  title: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: QuestType;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  xpReward: number;
  goldReward: number;
  deadline?: string;
  completedAt?: string;
  isRecurring: boolean;
  subObjectives: SubObjective[];
  parentQuestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestPayload {
  title: string;
  description?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  xpReward?: number;
  goldReward?: number;
  deadline?: string;
  isRecurring?: boolean;
  subObjectives?: Omit<SubObjective, 'id'>[];
  parentQuestId?: string;
}
