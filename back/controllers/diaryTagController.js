const DiaryEntry = require('../models/DiaryModel');
const Tag = require('../models/TagModel');
const io = require('../index'); // Импортируем `io`

const fs = require('fs'); // Импортируем `io`
const mongoose = require('mongoose');

exports.getAllTags = async (req, res) => {
    try {
        const tags = await Tag.find();
        res.status(200).json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createDiaryTag = async (req, res) => {
    try {
        const entryId = req.params.id;
        const { name } = req.body;

        // Проверяем, существует ли заметка
        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Проверяем, существует ли тег с похожим названием
        const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (existingTag) {
            entry.tags.push(existingTag._id);
            await entry.save();
            return res.status(200).json({ message: 'Tag with similar name already exists', tag: existingTag });
        }
        exports.createTag = async (req, res) => {
            try {
                const { name, entryId } = req.body;

                // Проверяем, существует ли тег с похожим названием
                const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

                if (existingTag) {
                    // Если тег существует, добавляем его к заметке
                    const entry = await DiaryEntry.findById(entryId);
                    if (!entry) {
                        return res.status(404).json({ message: 'Entry not found' });
                    }
                    if (!entry.tags.includes(existingTag._id)) {
                        entry.tags.push(existingTag._id);
                        await entry.save();
                    }
                    return res.status(200).json({ message: 'Tag already exists', tag: existingTag });
                }

                // Создаем новый тег
                const newTag = new Tag({ name });
                await newTag.save();

                // Добавляем новый тег к заметке
                const entry = await DiaryEntry.findById(entryId);
                if (!entry) {
                    return res.status(404).json({ message: 'Entry not found' });
                }
                entry.tags.push(newTag._id);
                await entry.save();

                res.status(201).json({ message: 'Tag created and added to entry successfully', tag: newTag });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        };

        // Создаем новый тег
        const tag = new Tag({ name: name });
        await tag.save();

        // Добавляем тег к заметке
        entry.tags.push(tag._id);
        await entry.save();

        res.status(201).json({ message: 'Tag created and added to entry successfully', tag });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteDiaryTag = async (req, res) => {
    try {
        const entryId = req.params.id;
        const { tagId } = req.body;

        // Находим заметку
        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // Удаляем тег из массива заметки
        entry.tags = entry.tags.filter((tag) => tag.toString() !== tagId);
        await entry.save();

        // Проверяем, используется ли тег в других заметках
        const tagUsageCount = await DiaryEntry.countDocuments({ tags: tagId });

        if (tagUsageCount === 0) {
            // Если тег больше нигде не используется, удаляем его из базы данных
            await Tag.findByIdAndDelete(tagId);
            res.status(200).json({ message: 'Tag removed from entry and deleted from database' });
        } else {
            res.status(200).json({ message: 'Tag removed from entry' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTag = async (req, res) => {
    try {
        const { name, entryId } = req.body;

        // Проверяем, является ли entryId допустимым ObjectId
        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            return res.status(400).json({ message: 'Invalid entryId' });
        }

        // Проверяем, существует ли тег с похожим названием
        const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (existingTag) {
            // Если тег существует, добавляем его к заметке
            const entry = await DiaryEntry.findById(entryId);
            if (!entry) {
                return res.status(404).json({ message: 'Entry not found' });
            }
            if (!entry.tags.includes(existingTag._id)) {
                entry.tags.push(existingTag._id);
                await entry.save();
            }
            return res.status(200).json({ message: 'Filter already exists', tag: existingTag });
        }

        // Создаем новый тег
        const newTag = new Tag({ name });
        await newTag.save();

        // Добавляем новый тег к заметке
        const entry = await DiaryEntry.findById(entryId);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        entry.tags.push(newTag._id);
        await entry.save();

        res.status(201).json({ message: 'Filter created and added to entry successfully', tag: newTag });
    } catch (err) {
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};
