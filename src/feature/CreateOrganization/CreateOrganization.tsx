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
import { Upload } from "lucide-react"; // Или другой иконки загрузки

export const CreateOrganizationModal = ({
  isOpen,
  onClose,
}: CreateOrganizationModalProps) => {
  const [formData, setFormData] = useState<OrganizationData>({
    name: "",
    description: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("Файл не выбран");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
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
    setFileName("Файл не выбран");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="font-manrope text-[16px] font-semibold">Создайте организацию</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле для загрузки изображения */}
          <div>
            <div className="flex items-center gap-3">
              <div
                {...getRootProps()}
                className="
                  w-full h-[40px] px-4
                  border border-input rounded-md
                  flex items-center justify-between
                  cursor-pointer hover:bg-accent/50
                  transition-colors
                "
              >
                <div className="flex items-center gap-2">
                  <span className="font-inter text-[14px] text-[#09090B] font-medium">Выберите фото</span>
                </div>
                <span className="font-inter text-[14px] text-[#A2ACB0] font-normal truncate max-w-[180px]">
                  {fileName}
                </span>
                <input {...getInputProps()} />
              </div>
            </div>
          </div>

          {/* Поле названия */}
          <div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Название организации"
              required
            />
          </div>

          {/* Поле описания */}
          <div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Описание организации"
              rows={4}
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="
                w-[105px] h-[40px]
                border-[#0D0BCC] bg-white text-[#0D0BCC]
                hover:bg-[#F0F0FF] hover:border-[#0D0BCC]/80
                font-inter text-[14px] font-medium
                cursor-pointer transition-colors
              "
            >
              Отменить
            </Button>
            <Button
              type="submit"
              className="
                w-[105px] h-[40px]
                bg-[#0D0BCC] text-white
                hover:bg-[#0D0BCC]/90
                font-inter text-[14px] font-medium
                cursor-pointer transition-colors
              "
            >
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};