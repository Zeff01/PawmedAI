import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import { mainRoute } from "./routes/main_route";
import { authRoute } from "./routes/auth";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    //credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/classify", mainRoute);
app.use("/auth", authRoute);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
