export type OrganizationData = {
  name: string;
  description: string;
  image?: File | string;
}

export type CreateOrganizationModalProps = {
  isOpen: boolean;
  onClose: () => void;
}
