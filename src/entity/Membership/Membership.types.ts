import { User } from "@entity/User";
import { Organization } from "@entity/Organization";



export type role = "owner" | "editor" | "presenter"

export type status = "pending" | "approved" | "declined"

export type Membership = {
  role: role,
  status: status,
  organization: Organization,
  user: User,
  created_at: string,
  updated_at: string
}
