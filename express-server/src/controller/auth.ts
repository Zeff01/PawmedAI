import { Request, Response } from "express";
import cookie from "cookie";
import { isEmail } from "../utils/isEmail";
import { supabase, supabaseAdmin } from "../db/db";

interface LoginPayload {
  identifier: string;
  password: string;
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, firstname, lastname } = req.body;

    if (!isEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // 1. Create Supabase user
    const { data: user, error: signupError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, //Skip Email Verification process
      });

    if (signupError) {
      res.status(400).json({ error: signupError.message });
      return;
    }

    // 2. Save additional info in 'profiles' table
    const { error: insertError } = await supabaseAdmin.from("users").insert([
      {
        uid: user.user?.id,
        user_username: username,
        user_firstname: firstname,
        user_lastname: lastname,
        user_email: email,
        user_rid: 2, //Role id 2 is for normal user
      },
    ]);

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    res.status(201).json({ message: "User created successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An internal error has occurred." });
    return;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body as LoginPayload;

    if (!identifier) {
      res.status(400).json({ message: "Missing username or email." });
      return;
    }

    if (!password) {
      res.status(400).json({ message: "Missing password." });
      return;
    }

    let emailToLogin = identifier;

    // If identifier is username, fetch corresponding email
    if (!isEmail(identifier)) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("user_email")
        .eq("user_username", identifier)
        .single();

      if (profileError || !profile) {
        res.status(400).json({ error: "Username not found" });
        return;
      }

      if (!profile.user_email) {
        res.status(400).json({ error: "No email found for this username" });
        return;
      }

      emailToLogin = profile.user_email;
    }

    // Perform email+password login
    const { data: authData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password,
      });

    if (loginError) {
      res.status(401).json({ error: loginError.message });
      return;
    }

    const refreshToken = authData.session?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ error: "Invalid or missing refresh token" });
      return;
    }

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sb-refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    );

    res.status(200).json({
      message: "Login successful",
      user: { uid: authData.user?.id },
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An internal error has occurred." });
    return;
  }
};
