import { api } from "@shared/api";
import { CreateSessionData, Session } from "@entity/Session/Session.types";


export const getUserOrganization = async () => {

};

export const createSession = async (data: CreateSessionData) => {
  return await api.post<Session>(`organizations/${data.organizationId}/quizzes/${data.quizId}/sessions`);
};
