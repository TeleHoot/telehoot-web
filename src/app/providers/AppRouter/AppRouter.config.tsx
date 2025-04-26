import { Navigate, Outlet, RouteObject } from "react-router-dom";
import {
  createContext,
  FC,
  LazyExoticComponent,
  PropsWithChildren,
  ReactNode,
  Suspense,
  useEffect,
  useState,
} from "react";
import { Auth } from "@pages/Auth";
import { getMe, User } from "@entity/User";
import { useQuery } from "react-query";
import { Header } from "@shared/components/Header";
import { getUserOrganization, Organization } from "@entity/Organization";

const ToLazy = (LazyComponent: LazyExoticComponent<FC>): ReactNode => (
  <Suspense fallback={""}>
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
        setActiveOrganization: (org: Organization) => setContextData(prev => ({ ...prev as OrganizationContext, activeOrganization: org })),
      });
    }
  }, [orgData?.data]);

  return (
    <OrganizationContext.Provider value={contextData}>
      {props.children}
    </OrganizationContext.Provider>
  );
};

export const ProtectedRoute = (): ReactNode => {
  const { isLoading, data } = useQuery({
    queryKey: ["auth"],
    queryFn: getMe,
  });

  if (isLoading) {
    return <>Loading...</>;
  }

  if (!data?.data)
    return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <AuthContext.Provider value={data.data}>
        <OrgProvider>
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
        </OrgProvider>
      </AuthContext.Provider>
    </div>);
};

export const ROUTES: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [],
  },
  {
    path: "/login",
    element: ToLazy(Auth),
  },
];
