import express from "express";
import { login, signup } from "../controller/auth";

const authRoute = express.Router();

authRoute.route("/signup").post(signup);
authRoute.route("/login").post(login);
export default authRoute;
