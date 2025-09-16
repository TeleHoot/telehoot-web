import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import { AuthContext, OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { useContext, useState } from "react";
import { Organization } from "@entity/Organization";
import { CreateOrganizationModal } from "@feature/CreateOrganization";
import { logout } from "@entity/User";
import { useNavigate } from "react-router-dom";

export function Header() {
  const user = useContext(AuthContext);
  const organizationContext = useContext(OrganizationContext);

  const onOrgClick = (organization: Organization) => {
    localStorage.setItem("organization", organization.id);
    organizationContext?.setActiveOrganization(organization);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full bg-[#F1F1F1] backdrop-blur shadow-[0px_8px_29.1px_0px_#9292920D]">
      <div className="flex h-16 items-center justify-between px-6 py-[22px] mx-auto max-w-[1512px]">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Telehoot"
          />
        </div>

        <div className="flex items-center gap-4 font-manrope font-weight-500">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                <span className="cursor-pointer">{organizationContext?.activeOrganization.name}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-0 bg-white" align="end">
              {organizationContext?.organizations?.map(organization => (
                <DropdownMenuItem
                  key={organization.id}
                  className="cursor-pointer"
                  onClick={() => onOrgClick(organization)}
                >
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
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                <span className="cursor-pointer">{user?.username}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white" align="end">
              <DropdownMenuLabel>Мой профиль</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                logout();
                navigate("/login", {
                  replace: true,
                });
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span className="cursor-pointer">Выйти</span>
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
