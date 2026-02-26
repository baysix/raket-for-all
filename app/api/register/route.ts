import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  name: z.string().min(1, "이름을 입력해주세요."),
  nickname: z.string().min(1, "닉네임을 입력해주세요."),
  phone: z.string().optional(),
  inviteCode: z.string().min(1, "초대코드를 입력해주세요."),
  profileImage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, nickname, phone, inviteCode, profileImage } =
      parsed.data;

    const supabase = createServerClient();

    // Verify invite code
    const { data: code } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode.toUpperCase().trim())
      .single();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 초대코드입니다." },
        { status: 400 }
      );
    }

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "만료된 초대코드입니다." },
        { status: 400 }
      );
    }

    if (code.used_count >= code.max_uses) {
      return NextResponse.json(
        { success: false, error: "사용 횟수가 초과된 초대코드입니다." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "이미 가입된 이메일입니다." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        name,
        nickname,
        phone: phone || null,
        profile_image: profileImage || null,
        role: code.role,
        club_id: code.club_id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { success: false, error: "회원가입에 실패했습니다." },
        { status: 500 }
      );
    }

    // Increment invite code usage
    await supabase
      .from("invite_codes")
      .update({ used_count: code.used_count + 1 })
      .eq("id", code.id);

    return NextResponse.json({
      success: true,
      data: { userId: newUser.id, email: newUser.email },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
