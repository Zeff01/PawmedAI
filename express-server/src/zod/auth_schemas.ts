// schemas/auth.schema.ts
import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" }),
    firstname: z.string().min(1, { message: "First name is required" }),
    lastname: z.string().min(1, { message: "Last name is required" }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, { message: "Username or email is required" }),
    password: z.string().min(1, { message: "Password is required" }),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
