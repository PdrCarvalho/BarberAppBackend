import { Router } from 'express';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import authMid from './app/middlewares/auth';

const routes = new Router();

routes.get('/', (req, res) => res.json({ mensagem: 'hello' }));
routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);
routes.use(authMid);
routes.put('/users', UserController.update);
export default routes;
