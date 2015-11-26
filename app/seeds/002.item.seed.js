'use strict';

var items = [
  {
    "title": "Notebook",
    "price": 5500.00,
    "image": "https://cdn.photographylife.com/wp-content/uploads/2014/06/Nikon-D810-Image-Sample-6.jpg",
    "user_id": "1"
  },
  {
    "title": "GoPro HERO4 SILVER",
    "price": 494.96,
    "image": "http://ecx.images-amazon.com/images/I/41LDdo2mphL.jpg",
    "user_id": "1"
  },
  {
    "title": "Apple iPhone 6 16GB 4G LTE",
    "price": 594.70,
    "image": "http://ecx.images-amazon.com/images/I/81D4af0lJ-L._SL1500_.jpg",
    "user_id": "2"
  }
];

export async function seed(knex) {
    await knex('item').insert(items);
}