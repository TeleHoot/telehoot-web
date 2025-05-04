import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Navigate, Outlet } from "react-router-dom";

const ABOUT_PAGE = "about";
const QUIZ_PAGE = "quizzes";
const MEMBERS_PAGE = "memberships";
const SETTINGS_PAGE = "settings";

type Pages = typeof ABOUT_PAGE | typeof QUIZ_PAGE | typeof MEMBERS_PAGE | typeof SETTINGS_PAGE;

const Organization = () => {
  const [activeTab, setActiveTab] = useState<Pages>("about");

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

  return (
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
          <TabsTrigger value={QUIZ_PAGE} className={tabTriggerClass}>
            Квизы
          </TabsTrigger>
          <TabsTrigger value={MEMBERS_PAGE} className={tabTriggerClass}>
            Пользователи
          </TabsTrigger>
          <TabsTrigger value={SETTINGS_PAGE} className={tabTriggerClass}>
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
  );
};

export default Organization;