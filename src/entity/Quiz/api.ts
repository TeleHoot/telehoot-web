import { api } from "@shared/api";
import { CreateQuiz, Quiz } from "./Quiz.types";

export const getOrganizationQuizzes = async (organizationId: string) => {
  return await api.get<Quiz[]>(`/organizations/${organizationId}/quizzes?limit=100`);
};

export const getQuiz = async (data: { organizationId?: string, quizId?: string }) => {
  return await api.get<Quiz>(`/organizations/${data.organizationId}/quizzes/${data.quizId}`);
};


export const createQuiz = async (params: CreateQuiz) => {
  const route = `/organizations/${params.organization_id}/quizzes`;

  delete params["organization_id"];

  return await api.post<Quiz>(route, params);
};

export const updateQuiz = async (params: CreateQuiz & { quizId?: string }) => {
  const route = `/organizations/${params.organization_id}/quizzes/${params.quizId}`;

  delete params["organization_id"];
  delete params["quizId"];

  return await api.patch<Quiz>(route, params);
};
