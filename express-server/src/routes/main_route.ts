import express from 'express';
import { classifyDissease } from '../controller/main_controller';

export const mainRoute = express.Router();

mainRoute.post('/', classifyDissease);

