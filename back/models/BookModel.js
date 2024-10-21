// models/BookModel.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: 'Unknown Title',
    },
    description: {
        type: String,
        default: 'Unknown description',
    },
    author: {
        type: String,
        default: 'Unknown Author',
    },
    language: {
        type: String,
        default: 'Unknown Language',
    },
    size: {
        type: Number, // Размер файла в байтах
        required: true,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    coverUrl: {
        type: String,
        default: null,
    },
    wordCount: {
        type: Number,
        default: 0,
    },
    lineCount: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model('Book', BookSchema);
