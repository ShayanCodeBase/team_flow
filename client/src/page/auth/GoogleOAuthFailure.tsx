import { useEffect, useRef, useState } from "react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setAccessToken } from "@/lib/auth-token";
import { getWorkspaceIdFromUser } from "@/lib/auth-utils";
import {
  getCurrentUserQueryFn,
  refreshAccessTokenFn,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";

const GoogleOAuthFailure = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const status = params.get("status");

    const fail = () => {
      setHasFailed(true);
      setIsProcessing(false);
    };

    if (status === "failure" || !token) {
      fail();
      return;
    }

    const completeSignIn = async () => {
      setAccessToken(token);

      const loadSession = async () => {
        try {
          return await getCurrentUserQueryFn();
        } catch {
          const accessToken = await refreshAccessTokenFn();
          setAccessToken(accessToken);
          return getCurrentUserQueryFn();
        }
      };

      try {
        const data = await loadSession();
        queryClient.setQueryData(["authUser"], data);
        window.history.replaceState({}, "", "/google/oauth/callback");
        navigate(`/workspace/${getWorkspaceIdFromUser(data.user)}`, {
          replace: true,
        });
      } catch {
        fail();
      }
    };

    void completeSignIn();
  }, [navigate, queryClient]);

  if (isProcessing && !hasFailed) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Completing sign in…</p>
      </div>
    );
  }

  if (!hasFailed) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          Team Flow
        </Link>
      </div>
      <Card>
        <CardContent>
          <div className="text-center mt-12 space-y-3">
            <h1 className="text-lg font-semibold">Authentication Failed</h1>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t sign you in with Google. Please try again.
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthFailure;
