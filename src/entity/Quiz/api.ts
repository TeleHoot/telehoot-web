import { api } from "@shared/api";
import { CreateQuiz, Quiz } from "./Quiz.types";

export const getOrganizationQuizzes = async (organizationId: string) => {
  return await api.get<Quiz[]>(`/organizations/${organizationId}/quizzes/?limit=100`);
};

export const createQuiz = async (params: CreateQuiz) => {
  const route = `/organizations/${params.organization_id}/quizzes/`

  delete params['organization_id']

  return await api.post<Quiz>(route, params);
};
