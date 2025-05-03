export type QuestionTypes = "single_choice" | "multiple_choice" | "text"

export type Answer = {
  text: string,
  is_correct: boolean,
  order: number
}

export type QuestionCreate = {
  order: number,
  title: string,
  type: QuestionTypes,
  weight: number,
  description?: string,
  media_path?: string,
  answers: Array<Answer>,

  quiz_id?: string,
  questionId?: string
}

export type Question = {
  order: number,
  title: string,
  type: QuestionTypes,
  weight: number,
  description?: string,
  media_path?: string,
  answers: Array<Answer>,
  id: string,
  quiz_id: string,
  created_at: string,
  updated_at: string,
  deleted_at: string
}
