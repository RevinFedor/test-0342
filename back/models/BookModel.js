const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Book', BookSchema);
