//archivo de rutas de usuario, define las rutas para el registro y el inicio de sesion de usuario

import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/user.controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;