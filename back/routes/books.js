const express = require('express');
const path = require('path');
const router = express.Router();
const multer = require('multer');
const bookController = require('../controllers/bookController');

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/books');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Use the unique ID as the filename
    },
});
const upload = multer({ storage: storage });

// Routes
router.post('/', upload.single('book'), bookController.uploadBook);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
