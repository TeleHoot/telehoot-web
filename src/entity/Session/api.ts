import { api } from "@shared/api";
import { CreateSessionData, Session } from "@entity/Session/Session.types";


export const getQuizSessions = async (data: CreateSessionData) => {
  return await api.get<Session[]>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions?limit=100`);
};

export const getSession = async (data: CreateSessionData & {sessionId: string}) => {
  return await api.get<Session>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions/${data.sessionId}`);
};

export const getSessionResults = async (data: CreateSessionData & {sessionId: string}) => {
  return await api.get<Session>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions/${data.sessionId}/results`);
};

export const exportResults = async (data: CreateSessionData & {sessionId: string}) => {
  return await api.get<Blob>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions/${data.sessionId}/export`, {responseType: 'blob'});
};

export const createSession = async (data: CreateSessionData) => {
  return await api.post<Session>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions`);
};
