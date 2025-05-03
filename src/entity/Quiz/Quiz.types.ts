import { User } from "@entity/User";

export type Quiz = {
  name: string,
  description: string,
  is_public?: boolean,
  id: string,
  organization_id: string,
  created_at: string,
  updated_at: string
  author: User
  questions_count: number,
}

export type CreateQuiz  = {
  name: string
  description: string
  is_public?: false,
  organization_id?: string
}
