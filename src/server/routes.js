import {Router} from 'express';

const rootRouter = new Router();

rootRouter.use('/', require('./controllers/user').default);
rootRouter.use('/', require('./controllers/home').default);
rootRouter.use('/', require('./controllers/auth').default);

export default rootRouter;