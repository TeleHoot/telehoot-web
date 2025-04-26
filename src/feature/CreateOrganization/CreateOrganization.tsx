import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Label } from "@shared/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { CreateOrganizationModalProps, OrganizationData } from "./CreateOrganization.types";
import { useMutation, useQueryClient } from "react-query";
import { createOrganization } from "@entity/Organization";

export const CreateOrganizationModal = ({
                                          isOpen,
                                          onClose,
                                        }: CreateOrganizationModalProps) => {
  const [formData, setFormData] = useState<OrganizationData>({
    name: "",
    description: "",
  });
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, OrganizationData>(
    "organization",
    createOrganization,
    {
      onSuccess: () => {
        queryClient.invalidateQueries("organization");
      },
      onError: (error: Error) => {
        console.log(error);
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Создать организацию</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле для загрузки изображения */}
          <div>
            <Label>Изображение организации</Label>
            <div
              {...getRootProps()}
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
            >
              <input {...getInputProps()} />
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-40 object-cover rounded-md"
                />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Перетащите изображение сюда или кликните для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, WEBP (макс. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Поле названия */}
          <div>
            <Label htmlFor="name">Название организации</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Введите название"
              required
            />
          </div>

          {/* Поле описания */}
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Краткое описание организации"
              rows={4}
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Отменить
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
