// upload.js
const multer = require('multer');
const path = require('path');

// Определяем место хранения файлов и имя файла
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}_${file.originalname}`);
    },
});

exports.uploadEntryImage = multer({ storage });
