import { Request, Response } from "express";
import { supabase, supabaseAdmin } from "../db/db";
import z from "zod";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, firstname, lastname } = req.body;

    // 1. Create Supabase user
    const { data: user, error: signupError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, //Skip Email Verification process
      });

    if (signupError) {
      console.log(signupError);
      res.status(400).json({ message: "An error occurred during signup" });
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
      console.log(insertError);
      res
        .status(500)
        .json({ message: "An error occurred during saving additional info" });
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
    const { identifier, password } = req.body;

    let emailToLogin = identifier;

    // Detect if it's an email
    const isEmail = z.email().safeParse(identifier).success;

    // If identifier is username, fetch corresponding email
    if (!isEmail) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("user_email")
        .eq("user_username", identifier)
        .single();

      if (profileError || !profile?.user_email) {
        res.status(400).json({ error: "Username not found or has no email" });
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
      console.log(loginError);
      res.status(401).json({
        message: "Something went wrong during login. Please try again",
      });
      return;
    }

    const refreshToken = authData.session?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ error: "Invalid or missing refresh token" });
      return;
    }

    // Set refresh token cookie
    res.cookie("sb-refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: { uid: authData.user?.id },
      access_token: authData.session?.access_token,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An internal error has occurred." });
    return;
  }
};
