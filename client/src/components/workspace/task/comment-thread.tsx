import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { useAuthContext } from "@/context/auth-provider";
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";
import { invalidateCommentQueries } from "@/lib/query-invalidation";
import { CommentType } from "@/types/api.type";
import { cn } from "@/lib/utils";

type CommentThreadProps = {
  taskId: string;
  workspaceId: string;
  onTotalCountChange?: (count: number) => void;
};

const COMMENTS_PAGE_SIZE = 20;

const commentsQueryKey = (workspaceId: string, taskId: string, page: number) =>
  ["task-comments", workspaceId, taskId, page] as const;

const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const secondsAgo = (Date.now() - date.getTime()) / 1000;
  if (secondsAgo < 60) return "just now";
  return formatDistanceToNow(date, { addSuffix: true });
};

const isCommentEdited = (comment: CommentType): boolean => {
  const created = new Date(comment.createdAt).getTime();
  const updated = new Date(comment.updatedAt).getTime();
  return updated - created > 1000;
};

type CommentRowProps = {
  comment: CommentType;
  taskId: string;
  workspaceId: string;
  currentUserId?: string;
  onUpdated: (comment: CommentType) => void;
  onDeleted: (commentId: string) => void;
};

function CommentRow({
  comment,
  taskId,
  workspaceId,
  currentUserId,
  onUpdated,
  onDeleted,
}: CommentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = Boolean(
    currentUserId && comment.author._id === currentUserId
  );

  const authorName = comment.author.name || "Unknown";
  const initials = getAvatarFallbackText(authorName);
  const avatarColor = getAvatarColor(authorName);
  const queryClient = useQueryClient();

  const { mutate: saveEdit, isPending: isSaving } = useMutation({
    mutationFn: () =>
      updateComment(taskId, workspaceId, comment._id, editContent.trim()),
    onSuccess: (result) => {
      onUpdated(result.comment);
      invalidateCommentQueries(queryClient, workspaceId, taskId);
      setIsEditing(false);
      toast({
        title: "Comment updated",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: confirmDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteComment(taskId, workspaceId, comment._id),
    onSuccess: () => {
      onDeleted(comment._id);
      invalidateCommentQueries(queryClient, workspaceId, taskId);
      setDeleteOpen(false);
      toast({
        title: "Comment deleted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) {
      setEditContent(comment.content);
    }
  }, [comment.content, isEditing]);

  return (
    <>
      <div className="flex gap-3 py-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
            avatarColor
          )}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isCommentEdited(comment) && (
              <span className="text-xs text-muted-foreground italic">
                edited
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving || !editContent.trim()}
                  onClick={() => saveEdit()}
                >
                  {isSaving && <Loader className="h-3 w-3 animate-spin mr-1" />}
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {isOwner && !isEditing && (
            <div className="flex gap-1 pt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setEditContent(comment.content);
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        isLoading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => confirmDelete()}
        title="Delete comment"
        description="Are you sure you want to delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}

export default function CommentThread({
  taskId,
  workspaceId,
  onTotalCountChange,
}: CommentThreadProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: commentsQueryKey(workspaceId, taskId, page),
    queryFn: () => getComments(taskId, workspaceId, page, COMMENTS_PAGE_SIZE),
    enabled: Boolean(taskId && workspaceId),
    staleTime: 0,
  });

  useEffect(() => {
    setPage(1);
    setAllComments([]);
    setTotalPages(1);
    setTotalCount(0);
  }, [taskId, workspaceId]);

  useEffect(() => {
    if (!data) return;

    setTotalPages(data.pagination.totalPages);
    setTotalCount(data.pagination.totalCount);
    onTotalCountChange?.(data.pagination.totalCount);

    if (page === 1) {
      setAllComments(data.comments);
    } else {
      setAllComments((prev) => {
        const existingIds = new Set(prev.map((c) => c._id));
        const appended = data.comments.filter((c) => !existingIds.has(c._id));
        return [...prev, ...appended];
      });
    }
  }, [data, page, onTotalCountChange]);

  const { mutate: postComment, isPending: isPosting } = useMutation({
    mutationFn: () => createComment(taskId, workspaceId, newComment.trim()),
    onSuccess: (result) => {
      setAllComments((prev) => [result.comment, ...prev]);
      setNewComment("");
      setTotalCount((prev) => {
        const next = prev + 1;
        onTotalCountChange?.(next);
        return next;
      });
      invalidateCommentQueries(queryClient, workspaceId, taskId);
      toast({
        title: "Comment posted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
    }
  };

  const handleCommentUpdated = (updated: CommentType) => {
    setAllComments((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setAllComments((prev) => prev.filter((c) => c._id !== commentId));
    setTotalCount((prev) => {
      const next = Math.max(0, prev - 1);
      onTotalCountChange?.(next);
      return next;
    });
  };

  const hasMore = page < totalPages;
  const isLoadingMore = isFetching && page > 1;

  return (
    <div className="space-y-3">
      {isLoading && page === 1 ? (
        <div className="flex justify-center py-6">
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : allComments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="divide-y">
          {allComments.map((comment) => (
            <CommentRow
              key={comment._id}
              comment={comment}
              taskId={taskId}
              workspaceId={workspaceId}
              currentUserId={user?._id}
              onUpdated={handleCommentUpdated}
              onDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isLoadingMore}
          onClick={handleLoadMore}
        >
          {isLoadingMore && <Loader className="h-4 w-4 animate-spin mr-2" />}
          Load more
        </Button>
      )}

      <Separator />

      <div className="space-y-2">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
        <Button
          type="button"
          size="sm"
          className="ml-auto flex"
          disabled={isPosting || !newComment.trim()}
          onClick={() => postComment()}
        >
          {isPosting && <Loader className="h-4 w-4 animate-spin mr-2" />}
          Post
        </Button>
      </div>
    </div>
  );
}
