"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Loader2,
  FileText,
  MessageSquare,
  Camera,
  X,
  ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const MAX_IMAGES = 3;

export default function NewPostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<
    { url: string; preview: string; uploading: boolean }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    type: "community",
    title: "",
    content: "",
  });

  const isAdmin =
    session?.user?.role === "platform_admin" ||
    session?.user?.role === "club_admin";

  const uploadingCount = images.filter((img) => img.uploading).length;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    const filesToUpload = files.slice(0, remaining);

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다.");
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      const index = images.length;

      setImages((prev) => [...prev, { url: "", preview, uploading: true }]);

      // Upload
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "event-images");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();

        if (!result.success) {
          toast.error(result.error);
          setImages((prev) => prev.filter((_, i) => i !== index));
          continue;
        }

        setImages((prev) =>
          prev.map((img, i) =>
            i === index ? { ...img, url: result.data.url, uploading: false } : img
          )
        );
      } catch {
        toast.error("이미지 업로드에 실패했습니다.");
        setImages((prev) => prev.filter((_, i) => i !== index));
      }
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingCount > 0) {
      toast.error("이미지 업로드 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);

    try {
      const imageUrls = images
        .filter((img) => img.url)
        .map((img) => img.url);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("게시글이 작성되었습니다!");
      router.push(`/community/${result.data.id}`);
    } catch {
      toast.error("게시글 작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">글쓰기</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 게시판 선택 + 제목 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FileText className="w-4 h-4 text-[#4CAF50]" />
            기본 정보
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">게시판 *</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="h-12 rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && (
                  <SelectItem value="announcement">공지사항</SelectItem>
                )}
                <SelectItem value="review">후기</SelectItem>
                <SelectItem value="community">자유게시판</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm text-gray-500">
              제목 *
            </Label>
            <Input
              id="title"
              placeholder="제목을 입력하세요"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            />
          </div>
        </div>

        {/* 내용 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MessageSquare className="w-4 h-4 text-[#4CAF50]" />
            내용
          </div>
          <Textarea
            id="content"
            placeholder="내용을 입력하세요..."
            value={form.content}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, content: e.target.value }))
            }
            required
            rows={8}
            className="rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50] resize-none min-h-[160px]"
          />
        </div>

        {/* 사진 첨부 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ImageIcon className="w-4 h-4 text-[#4CAF50]" />
              사진 첨부
            </div>
            <span className="text-xs text-gray-400">
              {images.length}/{MAX_IMAGES}
            </span>
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {images.map((img, i) => (
                <div key={i} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                  <img
                    src={img.preview}
                    alt={`첨부 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {i === 0 && !img.uploading && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#4CAF50] text-white">
                      썸네일
                    </span>
                  )}
                  {!img.uploading && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center active:bg-black/70"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add button */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">
                사진 추가 (최대 {MAX_IMAGES}장)
              </span>
            </button>
          )}

          <p className="text-[11px] text-gray-300">
            첫 번째 사진이 썸네일로 사용됩니다 · JPG, PNG, WebP · 5MB 이하
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full h-14 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white text-base font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={loading || uploadingCount > 0}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          작성하기
        </button>
      </form>
    </div>
  );
}
