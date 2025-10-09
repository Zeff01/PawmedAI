import express from 'express';
import { classifyDissease, classifyDisseaseBasedOnUserInput } from '../controller/main_controller';

export const mainRoute = express.Router();

mainRoute.post('/image', classifyDissease);
mainRoute.post('/text', classifyDisseaseBasedOnUserInput);

