import user from '../controllers/user.controller';

export default (app) => {
  app.post('/api/login', user.callOn('login'));
  app.post('/api/register', user.callOn('register'));

  app.route('/api/v1/user')
    .get(user.callOn('getUsers'));

  app.route('/api/v1/user/:id')
    .get(user.callOn('getUser'));

  app.route('/api/v1/me')
    .put(user.callOn('updateCurrentUser'))
    .get(user.callOn('getCurrentUser'));
};