import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { CheckIcon, CopyIcon, Loader, Mail } from "lucide-react";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { inviteMemberByEmailMutationFn } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";

const emailFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const workspaceId = useWorkspaceId();
  const [copied, setCopied] = useState(false);

  const inviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
        ":inviteCode",
        workspace.inviteCode
      )}`
    : "";

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: "" },
  });

  const { mutate: sendInviteEmail, isPending: isSendingEmail } = useMutation({
    mutationFn: inviteMemberByEmailMutationFn,
  });

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast({
          title: "Copied",
          description: "Invite url copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const onEmailSubmit = (values: z.infer<typeof emailFormSchema>) => {
    sendInviteEmail(
      { workspaceId, email: values.email },
      {
        onSuccess: (data) => {
          toast({
            title: "Invitation sent",
            description:
              data?.message ?? "The invitation email was sent successfully.",
            variant: "success",
          });
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Could not send invitation",
            description: getApiErrorMessage(error),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col pt-0.5 px-0 ">
      <h5 className="text-lg leading-[30px] font-semibold mb-1">
        Invite members to join you
      </h5>
      <p className="text-sm text-muted-foreground leading-tight">
        Share an invite link or send an email invitation directly to a teammate.
      </p>

      <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
        {workspaceLoading ? (
          <Loader className="w-8 h-8 animate-spin place-self-center flex" />
        ) : (
          <div className="space-y-4 py-3">
            <div>
              <Label className="text-sm font-medium">Invite link</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Anyone with this link can join the workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  disabled
                  className="disabled:opacity-100 disabled:pointer-events-none min-w-0"
                  value={inviteUrl}
                  readOnly
                />
                <Button
                  type="button"
                  className="shrink-0"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  aria-label="Copy invite link"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Email invitation</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Send the invite link to someone by email.
              </p>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onEmailSubmit)}
                  className="flex justify-center items-center flex-col sm:flex-row gap-2"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-0">
                        <FormLabel className="sr-only">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="colleague@company.com"
                            className="min-w-0 m-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSendingEmail}
                    className="shrink-0 sm:w-auto w-full"
                  >
                    {isSendingEmail ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-1.5" />
                        Send invite
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;
