import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown, LogOut, Plus, User } from "lucide-react";
import { AuthContext, OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { useContext, useState } from "react";
import { Organization } from "@entity/Organization";
import { CreateOrganizationModal } from "@feature/CreateOrganization";


export function Header() {
  const user = useContext(AuthContext);
  const organizationContext = useContext(OrganizationContext);

  const onOrgClick = (organization: Organization) => {
    localStorage.setItem("organization", JSON.stringify(organization));
    organizationContext?.setActiveOrganization(organization);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <YourLogoIcon className="h-6 w-6" />
          <span className="font-bold">MyApp</span>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                <span>{organizationContext?.activeOrganization.name}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-0" align="end">
              {organizationContext?.organizations?.map(organization => (
                <DropdownMenuItem className="cursor-pointer" onClick={() => onOrgClick(organization)}>
                  {organization.name}
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить организацию
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger>
              {user?.username}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Мой профиль</DropdownMenuLabel>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Профиль</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CreateOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </header>
  );
}

// Иконка логотипа (замените на свою)
function YourLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="M12 2v4" />
      <path d="m16 16 3 3" />
      <path d="M4 20 7 17" />
      <path d="M12 22v-4" />
      <path d="m8 16-3 3" />
      <path d="M20 20 17 17" />
      <path d="M2 4h4" />
      <path d="M22 4h-4" />
      <path d="M2 20h4" />
      <path d="M22 20h-4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
