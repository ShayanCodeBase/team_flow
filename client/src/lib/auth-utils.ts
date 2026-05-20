import { UserType } from "@/types/api.type";

/** Resolve workspace id whether API returned a populated object or a raw id string. */
export const getWorkspaceIdFromUser = (user: UserType): string => {
  const { currentWorkspace } = user;
  if (
    currentWorkspace &&
    typeof currentWorkspace === "object" &&
    "_id" in currentWorkspace
  ) {
    return currentWorkspace._id;
  }
  return String(currentWorkspace);
};
