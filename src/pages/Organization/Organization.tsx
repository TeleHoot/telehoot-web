import { useContext, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Navigate, Outlet, useLocation, useParams, useNavigate } from "react-router-dom";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { AuthContext, OrganizationContext } from "@app/providers/AppRouter/AppRouter.config";
import { createMembership, getUserMemberships } from "@entity/Membership";
import { getUserOrganizationById } from "@entity/Organization";
import { useMutation, useQuery } from "react-query";

const ABOUT_PAGE = "about";
const QUIZ_PAGE = "quizzes";
const MEMBERS_PAGE = "memberships";
const SETTINGS_PAGE = "settings";

type Pages = typeof ABOUT_PAGE | typeof QUIZ_PAGE | typeof MEMBERS_PAGE | typeof SETTINGS_PAGE;

const Organization = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Pages>(
    location.pathname.split("/")[location.pathname.split("/").length - 1] as Pages,
  );
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);

  const organizationContext = useContext(OrganizationContext);
  const authContext = useContext(AuthContext);
  const userOrganizations = organizationContext?.organizations;

  const isUserInOrganization = userOrganizations?.map(el => el.id).includes(id as string);

  const { data: userMembershipData } = useQuery(["Membership", id], () =>
    getUserMemberships(id, authContext?.id)
  );

  const { data: organizationData } = useQuery(["Organization", id], () =>
    getUserOrganizationById(id)
  );

  const createMemberShipMutation = useMutation(["Membership", id], createMembership);

  const membershipStatus = userMembershipData?.data?.status;
  const hasMembershipInOrganization = membershipStatus === "approved";
  const isPending = membershipStatus === "pending";
  const isDeclined = membershipStatus === "declined";

  const orgName = organizationData?.data?.name;

  useEffect(() => {
    if (!isUserInOrganization) {
      setShowJoinModal(true);
    } else {
      if (isPending) setShowPendingModal(true);
      if (isDeclined) setShowDeclinedModal(true);
    }
  }, [isUserInOrganization, isPending, isDeclined]);

  useEffect(() => {
    if (!hasMembershipInOrganization && activeTab !== ABOUT_PAGE) {
      setActiveTab(ABOUT_PAGE);
      navigate(ABOUT_PAGE, { replace: true });
    }
  }, [activeTab, hasMembershipInOrganization, navigate]);

  const handleJoinRequest = () => {
    createMemberShipMutation.mutate({ organizationId: id, userId: authContext?.id });
    setShowJoinModal(false);
  };

  const tabTriggerClass = `
    px-0 pb-3 relative shadow-none rounded-none
    text-[#71717A] font-medium font-inter
    cursor-pointer
    data-[state=active]:text-[#09090B]
    data-[state=active]:shadow-none
    data-[state=active]:after:content-['']
    data-[state=active]:after:absolute
    data-[state=active]:after:bottom-0
    data-[state=active]:after:left-0
    data-[state=active]:after:w-full
    data-[state=active]:after:h-[3px]
    data-[state=active]:after:bg-[#0D0BCC]
  `;

  const isTabsDisabled = !hasMembershipInOrganization;

  return (
    <>
      {/* Modal: Not a member */}
      {!isUserInOrganization && (
        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Хотите отправить запрос на вступление в организацию {orgName}?</DialogTitle>
              <DialogDescription>
                Действующее лицо организации рассмотрит Вашу заявку на вступление. При одобрении заявки Вы увидите организацию в списке и получите уведомление.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => setShowJoinModal(false)}>
                Отменить
              </Button>
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleJoinRequest}>
                Отправить запрос
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Pending request */}
      {isPending && (
        <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Запрос на вступление в {orgName} отправлен</DialogTitle>
              <DialogDescription>
                Ваш запрос на вступление в {orgName} находится на рассмотрении. Пожалуйста, ожидайте подтверждения.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowPendingModal(false)}>
                Ок
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Declined request */}
      {isDeclined && (
        <Dialog open={showDeclinedModal} onOpenChange={setShowDeclinedModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Запрос на вступление в {orgName} отклонён</DialogTitle>
              <DialogDescription>
                К сожалению, ваш запрос на вступление в {orgName} был отклонён.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowDeclinedModal(false)}>
                Ок
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="container mx-auto py-8 max-w-[890px] px-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Pages)}
          className="w-full mb-5 text-[#71717A] text-[16px]"
        >
          <TabsList className="w-full flex gap-8 p-0 bg-transparent">
            <TabsTrigger value={ABOUT_PAGE} className={tabTriggerClass}>
              Обзор
            </TabsTrigger>
            <TabsTrigger value={QUIZ_PAGE} className={tabTriggerClass} disabled={isTabsDisabled}>
              Квизы
            </TabsTrigger>
            <TabsTrigger value={MEMBERS_PAGE} className={tabTriggerClass} disabled={isTabsDisabled}>
              Пользователи
            </TabsTrigger>
            <TabsTrigger value={SETTINGS_PAGE} className={tabTriggerClass} disabled={isTabsDisabled}>
              Настройки организации
            </TabsTrigger>
          </TabsList>

          <TabsContent value={ABOUT_PAGE}>
            <Navigate to={ABOUT_PAGE} replace />
          </TabsContent>
          <TabsContent value={QUIZ_PAGE}>
            <Navigate to={QUIZ_PAGE} replace />
          </TabsContent>
          <TabsContent value={MEMBERS_PAGE}>
            <Navigate to={MEMBERS_PAGE} replace />
          </TabsContent>
          <TabsContent value={SETTINGS_PAGE}>
            <Navigate to={SETTINGS_PAGE} replace />
          </TabsContent>
        </Tabs>

        <Outlet />
      </div>
    </>
  );
};

export default Organization;
