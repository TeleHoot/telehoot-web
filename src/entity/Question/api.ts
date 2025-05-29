import { api } from "@shared/api";
import { Question, QuestionCreate } from "./Question.types";

export const getQuizQuestion = async (quizId: string) => {
  return await api.get<Question[]>(`/quizzes/${quizId}/questions`);
};

export const createQuestion = async (params: QuestionCreate) => {
  const route = `/quizzes/${params.quiz_id}/questions`;

  delete params["quiz_id"];

  return await api.post<Question>(route, params);
};

export const deleteQuestion = async (params: {quizId: string, questionId: string}) => {
  const route = `/quizzes/${params.quizId}/questions/${params.questionId}`;

  return await api.delete<Question>(route);
};


export const updateQuestion = async (params: QuestionCreate) => {
  const route = `/quizzes/${params.quiz_id}/questions/${params.questionId}`;

  delete params["quiz_id"];
  delete params["questionId"];

  await api.patch<Question>(route, params);

  if (params.image)
    await api.post(route + "/image", {
        file: params.image,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data", // Важно!
        },
      },
    );
};
