const express = require('express');
const fs = require('fs');
const router = express.Router();
const diaryEntriesController = require('../controllers/diaryEntriesController');
const diaryTagController = require('../controllers/diaryTagController');

const DiaryEntry = require('../models/DiaryModel');
const { uploadEntryImage } = require('../upload');

router.get('/getAllDiaryEntries', diaryEntriesController.getAllDiaryEntries);
router.post('/getAvailableFilters', diaryEntriesController.getAvailableFilters);
router.get('/getDiaryDates', diaryEntriesController.getDiaryDates);
router.get('/:id', diaryEntriesController.getDiaryEntryById);
router.post('/createDiaryEntry', diaryEntriesController.createDiaryEntry);
router.put('/:id', diaryEntriesController.updateDiaryEntry);
router.delete('/:id', diaryEntriesController.deleteDiaryEntry);
// Загрузить изображения
router.post('/:id/images', uploadEntryImage.single('file'), diaryEntriesController.uploadImageEntry);
// Удалить изображение
router.delete('/:id/images/:imageId', diaryEntriesController.deleteImageEntry);

module.exports = router;
