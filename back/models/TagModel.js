// models/TagModel.js
const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tag', TagSchema);
