import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { getWorkspaceIdFromUser } from "@/lib/auth-utils";
import { Navigate, Outlet } from "react-router-dom";

const AuthRoute = () => {
  const { data: authData, isLoading, isFetching } = useAuth();
  const user = authData?.user;

  const authBootstrapPending = isLoading || (isFetching && !authData);

  if (authBootstrapPending) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Outlet />;
  }

  const workspaceId = getWorkspaceIdFromUser(user);
  return <Navigate to={`/workspace/${workspaceId}`} replace />;
};

export default AuthRoute;
