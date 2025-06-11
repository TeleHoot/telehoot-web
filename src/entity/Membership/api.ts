import { api } from "@shared/api";
import { Membership } from "./Membership.types";

export const getMemberships = async (organizationId?: string) => {
  return await api.get<Membership[]>(`/memberships`, {
    params: {
      organization_id: organizationId,
    },
  });
};

export const getUserMemberships = async (organizationId?: string, userId?: string) => {
  return await api.get<Membership>(`/memberships/${organizationId}/${userId}`);
};

export const createMembership = async ({organizationId, userId}) => {
  return await api.post<Membership[]>(`/memberships`, {
    "role": "presenter",
    "status": "pending",
    "organization_id": organizationId,
    "user_id": userId
  });
};

export const updateMembership = async ({organizationId, userId, role, status}) => {
  return await api.patch<Membership>(`/memberships/${organizationId}/${userId}`, {role, status});
};
