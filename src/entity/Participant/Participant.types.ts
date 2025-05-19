import { User } from "@entity/User";
import { Session } from "react-router";

export type ParticipantRole = 'participant' | 'host'

export type Participant = {
  session_nickname: string,
  role: ParticipantRole,
  id: string,
  user: User
  session: Session
  created_at: string,
  updated_at: string
}

export type CreateParticipantData = {
  organizationId: string;
  quizId: string;
  sessionId: string;
  session_nickname: string,
  role: ParticipantRole,
}
