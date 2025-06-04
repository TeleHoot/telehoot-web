import { Navigate, Outlet, RouteObject } from "react-router-dom";
import {
  createContext,
  FC,
  LazyExoticComponent,
  PropsWithChildren,
  ReactNode,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import { Auth } from "@pages/Auth";
import { getMe, User } from "@entity/User";
import { useQuery } from "react-query";
import { Header } from "@shared/components/Header";
import { getUserOrganization, Organization } from "@entity/Organization";
import { Organization as OrganizationPage } from "@pages/Organization";
import { About } from "@pages/About";
import { Quizzes } from "@pages/Quizzes";
import { CreateQuiz } from "@pages/CreateQuiz";
import { Memberships } from "@pages/Memberships";
import { Settings } from "@pages/Settings";
import { Loader2 } from "lucide-react";
import { StartQuiz } from "@pages/StartQuiz";
import { Sessions } from "@pages/Sessions";

const ToLazy = (LazyComponent: LazyExoticComponent<FC>): ReactNode => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-[#0D0BCC]" />
    </div>
  }>
    <LazyComponent />
  </Suspense>
);

type OrganizationContext = {
  organizations: Organization[],
  activeOrganization: Organization,
  setActiveOrganization: (org: Organization) => void
};

export const AuthContext = createContext<User | null>(null);
export const OrganizationContext = createContext<OrganizationContext | null>(null);

const OrgProvider: FC<PropsWithChildren> = props => {
  const [contextData, setContextData] = useState<OrganizationContext | null>(null);

  const { data: orgData, isLoading: orgIsLoading } = useQuery("organization", getUserOrganization);

  useEffect(() => {
    if (orgData?.data) {
      const activeOrganization = localStorage.getItem("organization") ? JSON.parse(localStorage.getItem("organization") as string) : null;

      setContextData({
        organizations: orgData.data,
        activeOrganization: activeOrganization ? activeOrganization : orgData.data[0],
        setActiveOrganization: (org: Organization) => setContextData(prev => ({
          ...prev as OrganizationContext,
          activeOrganization: org,
        })),
      });
    }
  }, [orgData?.data]);

  return (
    <OrganizationContext.Provider value={contextData}>
      {props.children}
    </OrganizationContext.Provider>
  );
};

export const ProtectedRoute: FC<{ withHeader?: boolean }> = (props): ReactNode => {
  const { withHeader = true } = props;
  const { isLoading, data } = useQuery({
    queryKey: ["auth"],
    queryFn: getMe,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#0D0BCC]" />
      </div>
    );
  }

  if (!data?.data)
    return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F1F1]">
      <AuthContext.Provider value={data.data}>
        <OrgProvider>
          {withHeader && <Header />}
          <main className="flex-1">
            <Outlet />
          </main>
        </OrgProvider>
      </AuthContext.Provider>
    </div>);
};

const RedirectToFirstOrganization: FC = () => {
  const orgContext = useContext(OrganizationContext);

  if (orgContext?.activeOrganization)
    return <Navigate to={`/organization/${orgContext.activeOrganization.id}/about`} replace />;
};

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <RedirectToFirstOrganization />,
      },
      {
        path: "organization/:id",
        element: ToLazy(OrganizationPage),
        children: [{
          path: "about",
          element: ToLazy(About),
        }, {
          path: "quizzes",
          element: ToLazy(Quizzes),
        },{
          path: "memberships",
          element: ToLazy(Memberships),
        }, {
          path: "settings",
          element: ToLazy(Settings),
        },
        ],
      }, {
        path: "sessions/:id",
        element: ToLazy(Sessions),
      },
      {
        path: "quiz",
        element: ToLazy(CreateQuiz),
        children: [{
          path: ":id",
          element: ToLazy(CreateQuiz),
        }],
      },
    ],
  }, {
    path: "/",
    element: <ProtectedRoute withHeader={false}/>,
    children: [{
      path: "startQuiz/:id",
      element: ToLazy(StartQuiz),
    },],
  },

  {
    path: "/login",
    element: ToLazy(Auth),
  },
];
