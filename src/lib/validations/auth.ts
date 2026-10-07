import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid academic email address (e.g. student@university.edu)"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid academic email address (e.g. student@university.edu)"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),
  role: z.enum(["student", "teacher"]),
  identifier: z
    .string()
    .trim()
    .min(3, "Roll number or Faculty ID is required"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
