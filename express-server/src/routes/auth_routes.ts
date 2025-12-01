import express from 'express';
import { signup, signin, signout, refresh_token } from '../controller/auth_controller';

export const auth_routes = express.Router();

auth_routes.post('/signup', signup);
auth_routes.post('/signin', signin);
auth_routes.post('/refresh_token', refresh_token);
auth_routes.delete('/signout', signout)