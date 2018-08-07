'use strict';

// const knex = require('../knex');

// let searchTerm = 'gaga';
// // knex
//   .select('id', 'title', 'content')
//   .from('notes')
//   .modify(queryBuilder => {
//     if (searchTerm) {
//       queryBuilder.where('title', 'like', `%${searchTerm}%`);
//     }
//   })
//   .orderBy('id')
//   .then(results => {
//     console.log(JSON.stringify(results, null, 2));
//   })
//   .catch(err => {
//     console.error(err);
//   });

// let id = '1001';
// knex
//   .first('id', 'title','content')
//   .from('notes')
//   .where({id: id})
//   .then(result => {
//     if (result) {
//       console.log(JSON.stringify(result, null, 2));
//     } else {
//       console.log('item not found');
//     }
//   })
//   .catch(err => {
//     console.error(err);
//   });


// Update Note by id
// let updateObj = {
//   title: 'test title',
//   content: 'test test test asdfk alsdj fla ksdjf'
// };
// knex('notes')
//   .update(updateObj)
//   .where({id: id})
//   .returning(['id', 'title', 'content'])
//   .then(result => {
//     if (result) {
//       console.log(JSON.stringify(result, null, 2));
//     } else {
//       console.log('item not found');
//     }
//   })
//   .catch(err => {
//     console.error(err);
//   });
  

// Create Note by id
// let createObj = {
//   title: 'Create test title',
//   content: 'Create test test test asdfk alsdj fla ksdjf'
// };
// knex('notes')
//   .insert(createObj)
//   .returning(['id','title','content'])
//   .then(result => {
//     if (result) {
//       console.log(JSON.stringify(result, null, 2));
//     } else {
//       console.log('item not found');
//     }
//   })
//   .catch(err => {
//     console.error(err);
//   });

// Delete note by id
// knex('notes')
//   .where({id: id})
//   .del()
//   .then(result => {
//     if (result) {
//       console.log(JSON.stringify(result, null, 2));
//     } else {
//       console.log('item not found');
//     }
//   })
//   .catch(err => {
//     console.error(err);
//   });