import { api } from "@shared/api";

import { CreateParticipantData, Participant, ParticipantRole } from "./Participant.types";

export const getParticipant = async () => {
};

export const createParticipant = async (data: CreateParticipantData) => {
  return await api.post<Participant>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions/${data.sessionId}/participants`, {
    session_nickname: data.session_nickname,
    role: data.role,
  });
};
