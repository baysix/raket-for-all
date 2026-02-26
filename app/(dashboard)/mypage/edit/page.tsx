"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Loader2,
  Camera,
  User,
  CalendarDays,
  Zap,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ntrpOptions = [
  { value: "1.0", label: "1.0 (입문)" },
  { value: "1.5", label: "1.5" },
  { value: "2.0", label: "2.0 (초급)" },
  { value: "2.5", label: "2.5" },
  { value: "3.0", label: "3.0 (중하)" },
  { value: "3.5", label: "3.5" },
  { value: "4.0", label: "4.0 (중급)" },
  { value: "4.5", label: "4.5" },
  { value: "5.0", label: "5.0 (중상)" },
  { value: "5.5", label: "5.5" },
  { value: "6.0", label: "6.0 (상급)" },
  { value: "6.5", label: "6.5" },
  { value: "7.0", label: "7.0 (프로)" },
];

interface ProfileForm {
  nickname: string;
  phone: string;
  gender: string;
  tennis_start_date: string;
  ntrp_level: string;
  bio: string;
  profile_image: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    nickname: "",
    phone: "",
    gender: "",
    tennis_start_date: "",
    ntrp_level: "",
    bio: "",
    profile_image: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const result = await res.json();
      if (result.success) {
        const d = result.data;
        setForm({
          nickname: d.nickname || "",
          phone: d.phone || "",
          gender: d.gender || "",
          tennis_start_date: d.tennis_start_date || "",
          ntrp_level: d.ntrp_level || "",
          bio: d.bio || "",
          profile_image: d.profile_image || "",
        });
        if (d.tennis_start_date) {
          setSelectedDate(parseISO(d.tennis_start_date));
        }
        if (d.profile_image) {
          setPreviewImage(d.profile_image);
        }
      }
    } catch {
      toast.error("프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
    setUploading(true);

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
        setPreviewImage(form.profile_image || null);
        return;
      }

      setForm((prev) => ({ ...prev, profile_image: result.data.url }));
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
      setPreviewImage(form.profile_image || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      toast.error("이미지 업로드 중입니다.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: form.nickname || null,
          phone: form.phone || null,
          gender: form.gender || null,
          tennis_start_date: form.tennis_start_date || null,
          ntrp_level: form.ntrp_level || null,
          bio: form.bio || null,
          profile_image: form.profile_image || null,
        }),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // NextAuth 세션 업데이트
      await updateSession({
        nickname: form.nickname,
        image: form.profile_image,
      });

      toast.success("프로필이 수정되었습니다!");
      router.push("/mypage");
    } catch {
      toast.error("프로필 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

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
        <h1 className="text-lg font-bold">프로필 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile image */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
          >
            <Avatar className="w-24 h-24">
              <AvatarImage src={previewImage || undefined} />
              <AvatarFallback className="text-3xl bg-[#E8F5E9] text-[#4CAF50] font-bold">
                {(form.nickname || "U").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* 기본 정보 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <User className="w-4 h-4 text-[#4CAF50]" />
            기본 정보
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">닉네임</Label>
            <Input
              placeholder="닉네임을 입력하세요"
              value={form.nickname}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nickname: e.target.value }))
              }
              className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">성별</Label>
            <Select
              value={form.gender}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger className="h-12 rounded-lg border-gray-200">
                <SelectValue placeholder="성별 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남자</SelectItem>
                <SelectItem value="female">여자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">연락처</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="h-12 pl-10 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">자기소개</Label>
            <Textarea
              placeholder="간단한 자기소개를 입력하세요 (200자 이내)"
              value={form.bio}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bio: e.target.value }))
              }
              maxLength={200}
              rows={3}
              className="rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50] resize-none"
            />
            <p className="text-right text-[11px] text-gray-300">
              {form.bio.length}/200
            </p>
          </div>
        </div>

        {/* 테니스 정보 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Zap className="w-4 h-4 text-[#4CAF50]" />
            테니스 정보
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">테니스 시작일</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-12 px-4 flex items-center justify-between rounded-lg border border-gray-200 text-left text-sm active:bg-gray-50 transition-colors"
                >
                  {selectedDate ? (
                    <span className="font-medium">
                      {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
                    </span>
                  ) : (
                    <span className="text-gray-400">테니스 시작일을 선택하세요</span>
                  )}
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setForm((prev) => ({
                      ...prev,
                      tennis_start_date: date ? format(date, "yyyy-MM-dd") : "",
                    }));
                    setCalendarOpen(false);
                  }}
                  locale={ko}
                  disabled={(date) => date > new Date()}
                  defaultMonth={selectedDate || new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-[11px] text-gray-300">
              시작일을 기준으로 경력이 자동 산출됩니다
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-500">NTRP 레벨</Label>
            <Select
              value={form.ntrp_level}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, ntrp_level: value }))
              }
            >
              <SelectTrigger className="h-12 rounded-lg border-gray-200">
                <SelectValue placeholder="NTRP 레벨 선택" />
              </SelectTrigger>
              <SelectContent>
                {ntrpOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-gray-300">
              NTRP는 1.0(입문)부터 7.0(프로)까지의 테니스 실력 지표입니다
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full h-14 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white text-base font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={saving || uploading}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          저장하기
        </button>
      </form>
    </div>
  );
}
