import { useContext, useState } from "react";
import { useMutation } from "react-query";
import { updateOrganization } from "@entity/Organization";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrganizationSettings = () => {
  const organizationContext = useContext(OrganizationContext);
  const currentOrganization = organizationContext?.activeOrganization;

  const [name, setName] = useState(currentOrganization?.name || "");
  const [description, setDescription] = useState(currentOrganization?.description || "");
  const [image, setImage] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const initialData = {
    name: currentOrganization?.name || "",
    description: currentOrganization?.description || "",
    imagePath: currentOrganization?.image_path || "",
  };

  const hasChanges = () => {
    return (
      name !== initialData.name ||
      description !== initialData.description ||
      image !== null
    );
  };

  const { mutate: updateOrg, isLoading } = useMutation(['organization'],{
    mutationFn: async () => {
      if (!currentOrganization) return;
      await updateOrganization({
        id: currentOrganization.id,
        name,
        description,
        image: image || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Организация успешно обновлена");
    },
    onError: () => {
      toast.error("Ошибка обновления организации");
    },
  });

  const { mutate: deleteOrg, isLoading: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!currentOrganization) return;
      await updateOrganization({
        id: currentOrganization.id,
        name,
        description,
        image: image,
        deletedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Организация успешно удалена");
    },
    onError: () => {
      toast.error("Ошибка удаления организации");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="mx-auto py-8 max-w-[890px] px-4">
      <h1 className="text-xl font-semibold mb-6">Настройки организации</h1>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <Input
          placeholder="Название организации"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          placeholder="Описание организации"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-4 mt-4">
          <Button
            onClick={() => updateOrg()}
            disabled={!hasChanges() || isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "Сохраняем..." : "Сохранить"}
          </Button>

          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                Удалить
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Удалить организацию?</DialogTitle>
              </DialogHeader>
              <p>Вы уверены, что хотите удалить организацию? Это действие можно отменить.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Отмена
                </Button>
                <Button
                  onClick={() => {
                    deleteOrg();
                    setShowDeleteModal(false);
                  }}
                  disabled={isDeleting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isDeleting ? "Удаляем..." : "Удалить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default OrganizationSettings;
