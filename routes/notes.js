'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');

const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const { folderId } = req.query;
  const { tagId } = req.query;
  
  knex
    .select(
      'notes.id', 'notes.title', 'notes.content', 
      'folders.id as folderId', 'folders.name as folderName', 
      'tags.id as tagId', 'tags.name as tagName'
    )
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')

    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')

    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })

    .modify(function (queryBuilder) {
      if (tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })

    .orderBy('notes.id')
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});


// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .select(
      'notes.id', 'notes.title', 'notes.content',
      'folders.id as folderId', 'folders.name as folderName',
      'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    .where({'notes.id': id})
    .leftJoin('folders', 'notes.folder_id', 'folders.id')

    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')

    // .modify(queryBuilder => {
    //   if(folderId) {
    //     queryBuilder.where('folder_id', folderId);
    //   }
    // })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});


// Put update an item
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateObj = {
    title: title,
    content: content,
    folder_id: (folderId) ? folderId : null
  };

  knex
    .from('notes')
    .where({ 'id': noteId })
    .update(updateObj)
    .returning(['id'])
    .then(() => {
      return knex('notes_tags')
        .where('note_id', noteId)
        .del();
    })
    .then(() => {
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      return knex
        .select(
          'notes.id', 'notes.title', 'notes.content',
          'folders.id as folderId', 'folders.name as folderName',
          'tags.id as tagId', 'tags.name as tagName'
        )
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res.json(hydrated); 
      } else {
        next(); 
      }
    })
    .catch(err => next(err));
});



// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
    content: content,
    folder_id: (folderId) ? folderId : null
  };
  console.log(newItem);
  let noteId;

  knex
    .insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      return knex
        .select(
          'notes.id', 
          'notes.title', 
          'notes.content', 
          'notes.folder_id as folderId', 
          'folders.name as folderName', 
          'tags.id as tagId', 
          'tags.name as tagName'
        )
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then((results) => {
      const hydrated = hydrateNotes(results);
      res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated); 
    })
    .catch(err => {
      next(err);
    });

});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .where({id: id})
    .del()
    .then(() => {
      res.sendStatus(204);
    }) 
    .catch(err => {
      next(err);
    });
});

module.exports = router;
