"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Trash2,
  Send,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Post, Comment } from "@/types";

const typeConfig = {
  announcement: { label: "공지사항", bg: "bg-red-50", text: "text-red-600" },
  review: { label: "후기", bg: "bg-blue-50", text: "text-blue-600" },
  community: {
    label: "자유게시판",
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<
    (Post & { comments: Comment[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      const result = await res.json();
      if (result.success) {
        setPost(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    try {
      const res = await fetch(`/api/posts/${id}/likes`, { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                is_liked: result.data.liked,
                likes_count: result.data.liked
                  ? (prev.likes_count || 0) + 1
                  : (prev.likes_count || 0) - 1,
              }
            : null
        );
      }
    } catch {
      toast.error("처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commenting) return;
    setCommenting(true);

    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });

      const result = await res.json();
      if (result.success) {
        setPost((prev) =>
          prev
            ? { ...prev, comments: [...prev.comments, result.data] }
            : null
        );
        setCommentText("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("댓글 작성에 실패했습니다.");
    } finally {
      setCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("게시글이 삭제되었습니다.");
        router.push("/community");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-gray-400">게시글을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/community")}
          className="text-[#4CAF50] text-sm font-medium mt-2"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const config = typeConfig[post.type as keyof typeof typeConfig];
  const isOwner = session?.user?.id === post.author_id;
  const isAdmin =
    session?.user?.role === "platform_admin" ||
    session?.user?.role === "club_admin";
  const canManage = isOwner || isAdmin;

  return (
    <div className="pb-24">
      {/* Image viewer overlay */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setViewingImage(null)}
        >
          <img
            src={viewingImage}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
          {canManage ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-500 font-medium flex items-center gap-2 active:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 pt-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author?.profile_image || undefined} />
            <AvatarFallback className="text-sm bg-[#E8F5E9] text-[#4CAF50]">
              {(
                post.author?.nickname ||
                post.author?.name ||
                "?"
              ).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {post.author?.nickname || post.author?.name}
            </p>
            <p className="text-xs text-gray-400">
              {format(parseISO(post.created_at), "yyyy.M.d a h:mm", {
                locale: ko,
              })}
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold mb-4">{post.title}</h1>

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700 mb-4">
          {post.content}
        </p>

        {/* Images in body */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-4">
            {post.image_urls.length === 1 ? (
              <button
                onClick={() => setViewingImage(post.image_urls![0])}
                className="w-full"
              >
                <img
                  src={post.image_urls[0]}
                  alt=""
                  className="w-full rounded-xl object-cover max-h-80"
                />
              </button>
            ) : (
              <div
                className={cn(
                  "grid gap-2",
                  post.image_urls.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
                )}
              >
                {post.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setViewingImage(url)}
                    className={cn(
                      "rounded-xl overflow-hidden",
                      post.image_urls!.length === 3 && i === 0 && "col-span-2"
                    )}
                  >
                    <img
                      src={url}
                      alt=""
                      className={cn(
                        "w-full object-cover",
                        post.image_urls!.length === 3 && i === 0
                          ? "h-48"
                          : "h-36"
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Like + Comment counts */}
        <div className="flex items-center gap-4 py-3 border-t border-b border-gray-100">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm active:scale-95 transition-transform"
            disabled={liking}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                post.is_liked
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400"
              )}
            />
            <span
              className={
                post.is_liked
                  ? "text-red-500 font-medium"
                  : "text-gray-400"
              }
            >
              좋아요 {post.likes_count || 0}
            </span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <MessageSquare className="w-5 h-5" />
            <span>댓글 {post.comments?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="px-4 pt-4">
        <h3 className="font-bold text-sm mb-4">
          댓글 {post.comments?.length || 0}
        </h3>
        {post.comments?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            첫 댓글을 남겨보세요!
          </p>
        ) : (
          <div className="space-y-4">
            {post.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage
                    src={comment.author?.profile_image || undefined}
                  />
                  <AvatarFallback className="text-xs bg-gray-100 text-gray-500">
                    {(
                      comment.author?.nickname ||
                      comment.author?.name ||
                      "?"
                    ).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {comment.author?.nickname || comment.author?.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {format(
                          parseISO(comment.created_at),
                          "M/d h:mm",
                          { locale: ko }
                        )}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment input (fixed bottom) */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-3">
        <form
          onSubmit={handleComment}
          className="max-w-lg mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 h-10 px-4 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#4CAF50] transition-colors"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || commenting}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#4CAF50] text-white disabled:opacity-40 active:bg-[#388E3C] transition-colors shrink-0"
          >
            {commenting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
