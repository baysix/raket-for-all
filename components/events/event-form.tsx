"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
  Gamepad2,
  Users,
  FileText,
  AlignLeft,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6시 ~ 22시

export function EventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_hour: "",
    end_hour: "",
    location: "",
    court_info: "",
    game_type: "",
    max_participants: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
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
        setImagePreview(null);
        return;
      }

      setImageUrl(result.data.url);
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
      setImagePreview(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!form.start_hour || !form.end_hour) {
      toast.error("시작/종료 시간을 선택해주세요.");
      return;
    }
    if (uploading) {
      toast.error("이미지 업로드 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          event_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: `${form.start_hour.padStart(2, "0")}:00`,
          end_time: `${form.end_hour.padStart(2, "0")}:00`,
          location: form.location,
          court_info: form.court_info,
          game_type: form.game_type || undefined,
          max_participants: form.max_participants
            ? parseInt(form.max_participants)
            : null,
          image_url: imageUrl,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("일정이 등록되었습니다!");
      router.push(`/events/${result.data.id}`);
      router.refresh();
    } catch {
      toast.error("일정 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 기본 정보 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FileText className="w-4 h-4 text-[#4CAF50]" />
          기본 정보
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm text-gray-500">일정 제목 *</Label>
          <Input
            id="title"
            name="title"
            placeholder="예: 목요일 정기 랠리 게임"
            value={form.title}
            onChange={handleChange}
            required
            className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
          />
        </div>
      </div>

      {/* 사진 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Camera className="w-4 h-4 text-[#4CAF50]" />
          사진
        </div>

        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="미리보기"
              className="w-full h-48 object-cover rounded-lg"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  업로드 중...
                </div>
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center active:bg-black/70"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50 transition-colors"
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm">사진 추가 (선택)</span>
            <span className="text-[11px] text-gray-300">JPG, PNG, WebP · 5MB 이하</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      {/* 날짜 및 시간 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CalendarDays className="w-4 h-4 text-[#4CAF50]" />
          날짜 및 시간
        </div>

        {/* 날짜 */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-500">날짜 *</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-12 px-4 flex items-center justify-between rounded-lg border border-gray-200 text-left text-sm active:bg-gray-50 transition-colors"
              >
                {selectedDate ? (
                  <span className="font-medium">
                    {format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })}
                  </span>
                ) : (
                  <span className="text-gray-400">날짜를 선택하세요</span>
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
                  setCalendarOpen(false);
                }}
                locale={ko}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 시간 (시간 단위 셀렉트) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">시작 시간 *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <Select
                value={form.start_hour}
                onValueChange={(v) => setForm((prev) => ({ ...prev, start_hour: v }))}
              >
                <SelectTrigger className="h-12 pl-10 rounded-lg border-gray-200">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">종료 시간 *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <Select
                value={form.end_hour}
                onValueChange={(v) => setForm((prev) => ({ ...prev, end_hour: v }))}
              >
                <SelectTrigger className="h-12 pl-10 rounded-lg border-gray-200">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}시
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 장소 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <MapPin className="w-4 h-4 text-[#4CAF50]" />
          장소
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm text-gray-500">장소명</Label>
          <Input
            id="location"
            name="location"
            placeholder="예: 왕배산 테니스장"
            value={form.location}
            onChange={handleChange}
            className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="court_info" className="text-sm text-gray-500">코트 정보</Label>
          <Input
            id="court_info"
            name="court_info"
            placeholder="예: 1번 코트"
            value={form.court_info}
            onChange={handleChange}
            className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
          />
        </div>
      </div>

      {/* 게임 설정 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Gamepad2 className="w-4 h-4 text-[#4CAF50]" />
          게임 설정
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-gray-500">게임 유형</Label>
          <Select
            value={form.game_type}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, game_type: value }))
            }
          >
            <SelectTrigger className="h-12 rounded-lg border-gray-200">
              <SelectValue placeholder="게임 유형을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rally">랠리</SelectItem>
              <SelectItem value="singles">단식</SelectItem>
              <SelectItem value="doubles">복식</SelectItem>
              <SelectItem value="mixed_doubles">혼합복식</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_participants" className="text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              최대 참가 인원
            </span>
          </Label>
          <Input
            id="max_participants"
            name="max_participants"
            type="number"
            placeholder="제한 없음 (빈칸으로 두세요)"
            value={form.max_participants}
            onChange={handleChange}
            min={2}
            className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
          />
        </div>
      </div>

      {/* 상세 설명 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <AlignLeft className="w-4 h-4 text-[#4CAF50]" />
          상세 설명
        </div>
        <Textarea
          id="description"
          name="description"
          placeholder="일정에 대한 추가 안내사항을 입력하세요.&#10;&#10;예: 초보자 환영, 볼 준비 필요, 우천시 취소 등"
          value={form.description}
          onChange={handleChange}
          rows={8}
          className="rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50] resize-none min-h-[160px]"
        />
      </div>

      {/* 등록 버튼 */}
      <button
        type="submit"
        className="w-full h-14 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white text-base font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        disabled={loading || uploading}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        일정 등록하기
      </button>
    </form>
  );
}
