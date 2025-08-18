import dotenv from "dotenv";

dotenv.config()

import express from "express";
import cors from "cors";
import { mainRoute } from "./routes/main_route";
import { authRoute } from "./routes/auth";

const app = express();

app.use(cors({

  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  //credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/classify', mainRoute);
app.use('/auth', authRoute);

app.listen(process.env.PORT || 3000, () => {

  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});