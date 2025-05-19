import { Quiz } from "@entity/Quiz";

export type SessionStatus = 'waiting' | 'completed' | 'cancelled' | 'active'

export type Session = {
  join_code: string,
  status: SessionStatus,
  current_question_index: number,
  id: string,
  quiz: Quiz
  created_at: string,
  updated_at: string,
}

export type CreateSessionData = {
  organizationId: string;
  quizId: string;
}
