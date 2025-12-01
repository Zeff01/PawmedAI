import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import { classify_disease_routes } from "./routes/classify_disease_routes";
import { auth_routes } from "./routes/auth_routes";

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

app.use("/classify", classify_disease_routes);
app.use("/auth", auth_routes);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
