import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";

import { TabsContent } from "@radix-ui/react-tabs";
import { Navigate, Outlet } from "react-router-dom";

const ABOUT_PAGE = "about";
const QUIZ_PAGE = "quizzes";
const MEMBERS_PAGE = "members";
const SETTINGS_PAGE = "settings";

type Pages = typeof ABOUT_PAGE | typeof QUIZ_PAGE | typeof MEMBERS_PAGE | typeof SETTINGS_PAGE

const Organization = () => {
  const [activeTab, setActiveTab] = useState<Pages>("about");

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Pages)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="about">
            Обзор
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            Квизы
          </TabsTrigger>
          <TabsTrigger value="memberships">
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="settings" className="hidden md:flex">
            Настройки организации
          </TabsTrigger>
        </TabsList>

        <TabsContent value={'about'}>
          <Navigate to={'about'}/>
        </TabsContent>
        <TabsContent value={'quizzes'}>
          <Navigate to={'quizzes'}/>
        </TabsContent>
        <TabsContent value={'memberships'}>
          <Navigate to={'memberships'}/>
        </TabsContent>
      </Tabs>

      <Outlet/>
    </div>
  );
};

export default Organization;
