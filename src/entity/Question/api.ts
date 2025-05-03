import { api } from "@shared/api";
import { Question, QuestionCreate } from "./Question.types";

export const getQuizQuestion = async (quizId: string) => {
  return await api.get<Question[]>(`/quizzes/${quizId}/questions/`);
};

export const createQuestion = async (params: QuestionCreate) => {
  const route = `/quizzes/${params.quiz_id}/questions/`;

  delete params["quiz_id"];

  return await api.post<Question>(route, params);
};

export const updateQuestion = async (params: QuestionCreate) => {
  const route = `/quizzes/${params.quiz_id}/questions/${params.questionId}`;

  delete params["quiz_id"];
  delete params["questionId"];

  return await api.patch<Question>(route, params);
};
