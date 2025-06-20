import { api } from "@shared/api";
import { Organization } from "@entity/Organization/Organization.types";
import { OrganizationData } from "@feature/CreateOrganization";

export const getUserOrganization = async () => {
  return await api.get<Organization[]>("/users/me/organizations");
};

export const getUserOrganizationById = async (id: string) => {
  return await api.get<Organization>(`/organizations/${id}`);
};


export const updateOrganization = async (data: OrganizationData & { id: string }) => {
  const org = await api.patch<Organization>(`/organizations/${data.id}`, {
    name: data.name,
    description: data.description,
  });

  if (data.image)
    await api.post<OrganizationData>("/organizations/" + org.data.id + "/image", {
        file: data.image,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data", // Важно!
        },
      },
    );
};

export const createOrganization = async (data: OrganizationData) => {
  const org = await api.post<void, Organization>("/organizations", {
    name: data.name,
    description: data.description,
  });
  if (data.image)
    await api.post<OrganizationData>("/organizations/" + org.data.id + "/image", {
        file: data.image,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data", // Важно!
        },
      },
    );
};
