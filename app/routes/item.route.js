import item from '../controllers/item.controller';

export default (app) => {
  app.route('/api/v1/item')
    .post(item.callOn('createItem'));

  app.route('/api/item')
    .get(item.callOn('getItems'));

  app.route('/api/v1/item/:id')
    .put(item.callOn('updateItem'))
    .delete(item.callOn('removeItem'));

  app.route('/api/item/:id')
    .get(item.callOn('getItem'));

  app.route('/api/v1/item/:id/image')
    .post(item.callOn('uploadImage'))
    .delete(item.callOn('removeImage'));
};