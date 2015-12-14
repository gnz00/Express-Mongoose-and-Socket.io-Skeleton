/**
 * Home Controller
 */

import { Router } from 'express';

const router = new Router();

router.get('/', async (req, res, next) => {
  if (req.user) {
    return res.redirect('/api');
  }
  res.render('home/home', {
    url: req.url
  });
});

export default router;

