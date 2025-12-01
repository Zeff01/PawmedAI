import express from 'express';
import { classify_dissease_based_on_image_url, classify_dissease_based_on_user_input } from '../controller/classify_disease_controller';
import { authenticate_user } from '../controller/auth_controller';

export const classify_disease_routes = express.Router();

classify_disease_routes.post('/image', authenticate_user, classify_dissease_based_on_image_url);
classify_disease_routes.post('/text', authenticate_user,  classify_dissease_based_on_user_input);

