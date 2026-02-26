"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Plus,
  MessageSquare,
  Heart,
  FileText,
  PenSquare,
  ImageIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";

const typeConfig = {
  announcement: { label: "공지", color: "bg-red-100 text-red-600" },
  review: { label: "후기", color: "bg-blue-100 text-blue-600" },
  community: { label: "자유", color: "bg-gray-100 text-gray-600" },
};

const tabs = [
  { value: "all", label: "전체" },
  { value: "announcement", label: "공지" },
  { value: "review", label: "후기" },
  { value: "community", label: "자유" },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPosts(activeTab === "all" ? undefined : activeTab);
  }, [activeTab]);

  const fetchPosts = async (type?: string) => {
    setLoading(true);
    try {
      const url = type ? `/api/posts?type=${type}` : "/api/posts";
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setPosts(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">커뮤니티</h1>
        <Link
          href="/community/new"
          className="flex items-center gap-1 px-3 py-2 bg-[#4CAF50] text-white text-sm font-semibold rounded-lg active:bg-[#43A047] transition-colors"
        >
          <Plus className="w-4 h-4" />
          글쓰기
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="px-4 pb-3">
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                activeTab === tab.value
                  ? "bg-[#4CAF50] text-white"
                  : "bg-gray-100 text-gray-500 active:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">게시글이 없습니다.</p>
            <Link
              href="/community/new"
              className="inline-flex items-center gap-1 px-4 py-2.5 bg-[#4CAF50] text-white text-sm font-semibold rounded-lg active:bg-[#43A047] transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              첫 글 작성하기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => {
              const config =
                typeConfig[post.type as keyof typeof typeConfig];
              const thumbnail = post.image_urls?.[0];

              return (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block"
                >
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden active:bg-gray-50 transition-colors">
                    <div className="flex">
                      {/* Content */}
                      <div className="flex-1 min-w-0 p-4">
                        {/* Author row */}
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={
                                post.author?.profile_image || undefined
                              }
                            />
                            <AvatarFallback className="text-[10px] bg-[#E8F5E9] text-[#4CAF50]">
                              {(
                                post.author?.nickname ||
                                post.author?.name ||
                                "?"
                              ).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-gray-700 truncate">
                            {post.author?.nickname || post.author?.name}
                          </span>
                          <span className="text-[10px] text-gray-300">
                            ·
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {format(parseISO(post.created_at), "M/d", {
                              locale: ko,
                            })}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.color} ml-auto shrink-0`}
                          >
                            {post.is_pinned && "📌 "}
                            {config.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-sm mb-1 truncate">
                          {post.title}
                        </h3>

                        {/* Content preview */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2.5">
                          {post.content}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-xs flex items-center gap-1",
                              post.is_liked
                                ? "text-red-500"
                                : "text-gray-400"
                            )}
                          >
                            <Heart
                              className={cn(
                                "w-3.5 h-3.5",
                                post.is_liked && "fill-red-500"
                              )}
                            />
                            {post.likes_count || 0}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {post.comments_count || 0}
                          </span>
                          {post.image_urls && post.image_urls.length > 0 && !thumbnail && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" />
                              {post.image_urls.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      {thumbnail && (
                        <div className="w-24 shrink-0">
                          <img
                            src={thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
