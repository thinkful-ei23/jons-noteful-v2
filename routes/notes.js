'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');

const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const { folderId } = req.query;
  const { tagId } = req.query;
  
  knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
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
  const { folderId } = req.query;
  knex
    .first('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    .where({'notes.id': id})
    .leftJoin('folders', 'notes.folder_id', 'folders.id')

    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')

    .modify(queryBuilder => {
      if(folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
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

  // notes.find(id)
  //   .then(item => {
  //     if (item) {
  //       res.json(item);
  //     } else {
  //       next();
  //     }
  //   })
  //   .catch(err => {
  //     next(err);
  //   });
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const updateObj = {
    title: title,
    content: content,
    folder_id: (folderId) ? folderId : null
  };

  // Update note in notes table
  knex.update(updateObj)
    .from('notes')
    .where({ 'notes.id': noteId })
    .then(() => {
      // Delete current related tags from notes_tags table
      return knex('notes_tags')
        .where('note_id', noteId)
        .del()
;
    })
    .then(() => {
      // Insert related tags into notes_tags table
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId.id }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the updated note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        // Hydrate the results
        const hydrated = hydrateNotes(result);
        // Respond with a 200 status and a note object
        res.json(hydrated); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});



// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId } = req.body;

  const newItem = {
    title: title,
    content: content,
    folder_id: folderId  // Add `folderId`
  };

  let noteId;

  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex
    .insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      return knex.select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      const hydrated = hydrateNotes(result)[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(hydrated); 
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
