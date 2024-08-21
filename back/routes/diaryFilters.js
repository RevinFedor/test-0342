const diaryTagController = require('../controllers/diaryTagController');
const express = require('express');
const router = express.Router();

router.get('/getAllTags', diaryTagController.getAllTags);
router.post('/:id', diaryTagController.createDiaryTag);

router.delete('/:id', diaryTagController.deleteDiaryTag);
router.post('/create/tagfortg', diaryTagController.createTag);

module.exports = router;
