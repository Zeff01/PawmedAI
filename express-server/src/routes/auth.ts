import express from "express";
import { login, signup } from "../controller/auth";
import { validate } from "../middleware/validate";
import { loginSchema, signupSchema } from "../zod/auth_schemas";

const authRoute = express.Router();

authRoute.route("/signup").post(validate(signupSchema), signup);
authRoute.route("/login").post(validate(loginSchema), login);

export default authRoute;
