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
import { Check, MoreVertical, X, Search, Loader2 } from "lucide-react";
import { getMemberships, role } from "@entity/Membership";
import { OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { Input } from "@shared/components/ui/input";

const roleLabels: Record<role, string> = {
  owner: "Администратор",
  editor: "Редактор",
  presenter: "Ведущий",
};

// Вынесенные стили для табов
const tabListStyles = "flex flex-col items-start h-auto bg-transparent shadow-none font-inter text-[16px] text-[#71717A] font-medium";
const tabTriggerStyles = "w-full shadow-none justify-start data-[state=active]:border-l-[3px] data-[state=active]:border-l-[#0D0BCC] data-[state=active]:bg-transparent data-[state=active]:text-[#09090B] data-[state=active]:shadow-none rounded-none";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-[#0D0BCC]" />
      </div>
    );
  }

  const filteredMemberships = memberships?.filter(member => {
    if (activeTab !== "requests" && member.status !== "approved") return false;
    if (searchTerm && !member.user.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeTab !== "all" && activeTab !== "requests" && member.role !== activeTab) return false;
    if (activeTab === "requests" && member.status !== "pending") return false;
    return true;
  });

  const handleApprove = async (membershipId: string) => {
    await approveMembership(membershipId);
    refetch();
  };

  const handleReject = async (membershipId: string) => {
    await rejectMembership(membershipId);
    refetch();
  };

  const handleRemove = async (membershipId: string) => {
    await removeMembership(membershipId);
    refetch();
  };

  const handleChangeRole = async (membershipId: string, newRole: role) => {
    await changeMembershipRole(membershipId, newRole);
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[20px] font-manrope font-semibold text-[#000000]">Пользователи</h1>

      <div className="flex gap-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Найдите участника"
              className="w-full pl-9 border border-[#A2ACB0] shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-64 border border-[#A2ACB0] rounded-lg p-4 shadow-none">
            <div className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as role | "all" | "requests")}
                orientation="vertical"
                className="space-y-2"
              >
                <TabsList className={tabListStyles}>
                  <TabsTrigger value="all" className={tabTriggerStyles}>
                    Все
                  </TabsTrigger>
                  <TabsTrigger value="owner" className={tabTriggerStyles}>
                    Администраторы
                  </TabsTrigger>
                  <TabsTrigger value="editor" className={tabTriggerStyles}>
                    Редакторы
                  </TabsTrigger>
                  <TabsTrigger value="presenter" className={tabTriggerStyles}>
                    Ведущие
                  </TabsTrigger>
                  <TabsTrigger value="requests" className={tabTriggerStyles}>
                    Запросы
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <Card className="shadow-none border-none">
            <CardContent className="pt-6 px-0">
              <div className="space-y-4">
                {filteredMemberships?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    {activeTab === "requests" ? (
                      <>
                        <Check className="h-8 w-8 text-[#18191B]" />
                        <div className="font-manrope font-normal text-[20px] text-[#18191B]">
                          Запросов на присоединение в организацию нет
                        </div>
                      </>
                    ) : (
                      <>
                        <Search className="h-8 w-8 text-[#18191B]" />
                        <div className="font-manrope font-normal text-[20px] text-[#18191B]">
                          Такой пользователь не найден
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  filteredMemberships?.map((member) => (
                    <div
                      key={`${member.user.id}-${member.role}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={member.user.photo_url} />
                          <AvatarFallback>
                            {member.user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-manrope font-semibold text-[16px] text-[#18191B]">
                            {member.user.username}
                          </div>
                          <div className="font-manrope font-normal text-[14px] text-[#707579]">
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
                              onClick={() => handleApprove(member.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Принять
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(member.id)}
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
                                onClick={() => handleChangeRole(member.id, "owner")}
                              >
                                Сделать администратором
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, "editor")}
                              >
                                Сделать редактором
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member.id, "presenter")}
                              >
                                Сделать ведущим
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemove(member.id)}
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
    </div>
  );
}

// Заглушки для API функций
async function approveMembership(membershipId: string) {
  // Реализация API вызова
}

async function rejectMembership(membershipId: string) {
  // Реализация API вызова
}

async function removeMembership(membershipId: string) {
  // Реализация API вызова
}

async function changeMembershipRole(membershipId: string, newRole: role) {
  // Реализация API вызова
}