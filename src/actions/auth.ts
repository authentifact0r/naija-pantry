"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  setAuthCookies,
  clearAuthCookies,
  type JWTPayload,
} from "@/lib/auth";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerAction(formData: FormData): Promise<void> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    redirect("/register?error=" + encodeURIComponent(parsed.error.issues[0].message));
  }

  const { email, password, firstName, lastName, phone } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=" + encodeURIComponent("An account with this email already exists"));
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { email, passwordHash, firstName, lastName, phone },
  });

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  await setAuthCookies(payload);
  redirect("/account");
}

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent(parsed.error.issues[0].message));
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password"));
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password"));
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  await setAuthCookies(payload);
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookies();
  redirect("/");
}
