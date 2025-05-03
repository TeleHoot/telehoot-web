import { useContext, useState } from "react";
import { useQuery } from "react-query";
import { Card, CardContent } from "@shared/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Check, MoreVertical, X } from "lucide-react";
import { getMemberships, role } from "@entity/Membership";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { Input } from "@shared/components/ui/input";

const roleLabels: Record<role, string> = {
  owner: "Администратор",
  editor: "Редактор",
  presenter: "Ведущий",
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<role | "all" | "requests">("all");
  const organizationContext = useContext(OrganizationContext);
  const currentOrganizationId = organizationContext?.activeOrganization.id;

  const { data: membershipsQuery, isLoading, refetch } = useQuery({
    queryKey: ["memberships"],
    queryFn: () => getMemberships(currentOrganizationId),
  });

  const memberships = membershipsQuery?.data;

  if (isLoading) return <div>Loading...</div>;

  const filteredMemberships = memberships?.filter(member => {
    if (activeTab !== "requests" && member.status !== "approved") return false;
    if (searchTerm && !member.user.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeTab !== "all" && activeTab !== "requests" && member.role !== activeTab) return false;
    if (activeTab === "requests" && member.status !== "pending") return false;
    return true;
  });

  const handleApprove = async (membershipId: string) => {
    // API call to approve membership
    await approveMembership(membershipId);
    refetch();
  };

  const handleReject = async (membershipId: string) => {
    // API call to reject membership
    await rejectMembership(membershipId);
    refetch();
  };

  const handleRemove = async (membershipId: string) => {
    // API call to remove membership
    await removeMembership(membershipId);
    refetch();
  };

  const handleChangeRole = async (membershipId: string, newRole: role) => {
    // API call to change role
    await changeMembershipRole(membershipId, newRole);
    refetch();
  };

  return (
    <div className="flex gap-6">
      <div className="flex flex-col gap-4">
        <Input
          type="text"
          placeholder="Поиск пользователей..."
          className="w-full px-3 py-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="w-64 border rounded-lg p-4">
          <div className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as role | "all" | "requests")}
              orientation="vertical"
              className="space-y-2"
            >
              <TabsList className="flex flex-col items-start h-auto">
                <TabsTrigger value="all" className="w-full justify-start">Все</TabsTrigger>
                <TabsTrigger value="owner" className="w-full justify-start">Администраторы</TabsTrigger>
                <TabsTrigger value="editor" className="w-full justify-start">Редакторы</TabsTrigger>
                <TabsTrigger value="presenter" className="w-full justify-start">Ведущие</TabsTrigger>
                <TabsTrigger value="requests" className="w-full justify-start">Запросы</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {filteredMemberships?.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Пользователи не найдены
                </div>
              ) : (
                filteredMemberships?.map((member) => (
                  <div
                    key={`${member.user.id}-${member.role}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user.photo_url} />
                        <AvatarFallback>
                          {member.user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {roleLabels[member.role]}
                          {member.status === "pending" && " (Ожидает подтверждения)"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {member.status === "pending" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(member)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Принять
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(member)}
                          >
                            <X className="h-4 w-4 mr-1" /> Отклонить
                          </Button>
                        </>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleChangeRole(member, "owner")}
                            >
                              Изменить роль
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(member)}
                              className="text-red-600"
                            >
                              Удалить из организации
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Заглушки для API функций (замените на реальные вызовы)
async function approveMembership(membershipId: string) {
}

async function rejectMembership(membershipId: string) {
}

async function removeMembership(membershipId: string) {
}

async function changeMembershipRole(membershipId: string, newRole: role) {
}
