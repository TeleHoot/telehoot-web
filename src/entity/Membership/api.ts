import { api } from "@shared/api";
import { Membership } from "./Membership.types";

export const getMemberships = async (organizationId?: string) => {
  return await api.get<Membership[]>(`/memberships/`, {
    params: {
      organization_id: organizationId,
    },
  });
};
