const DiaryEntry = require('../models/DiaryModel');
const io = require('../index'); // Импортируем `io`
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Tag = require('../models/TagModel');
const { SOURCE_TYPES, FLAT_SOURCE_TYPES, SOURCE_SUBTYPES } = require('../models/sourceTypes');
// http://localhost:3500/api/diaryEntries/

// Получить все записи
exports.getAllDiaryEntries = async (req, res) => {
    try {
        let pipeline = [];

        if (req.query.tags || req.query.sources) {
            let matchConditions = [];

            if (req.query.tags) {
                const tags = req.query.tags.split(',').map((tag) => new mongoose.Types.ObjectId(tag.trim()));
                const isStrict = req.query.strict === 'true';

                if (isStrict) {
                    matchConditions.push({ tags: { $all: tags } });
                } else {
                    matchConditions.push({ tags: { $in: tags } });
                }
            }

            if (req.query.sources) {
                const sources = req.query.sources.split(',');
                const expandedSources = sources.reduce((acc, source) => {
                    if (SOURCE_TYPES[source.toUpperCase()]) {
                        // Если это основной тип источника, добавляем его и все его подтипы
                        return [...acc, source, ...SOURCE_SUBTYPES[source]];
                    }
                    if (source === 'all') {
                        // Если выбрано 'all', добавляем все подтипы Telegram
                        return [...acc, ...SOURCE_SUBTYPES[SOURCE_TYPES.TELEGRAM].filter((subtype) => subtype !== 'all')];
                    }
                    // Если это не основной тип, просто добавляем его
                    return [...acc, source];
                }, []);

                matchConditions.push({
                    $or: [{ 'forward_origin.type': { $in: expandedSources } }, { 'forward_origin.subtype': { $in: expandedSources } }],
                });
            }

            pipeline.push({ $match: { $and: matchConditions } });
        }

        pipeline.push({ $lookup: { from: 'tags', localField: 'tags', foreignField: '_id', as: 'tags' } });

        // Add sorting stage
        const sortField = req.query.sortField || 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        let sortStage = {};
        if (sortField === 'date') {
            sortStage = { createdAt: sortOrder };
        } else if (sortField === 'name') {
            sortStage = { title: sortOrder };
        }

        pipeline.push({ $sort: sortStage });

        const entries = await DiaryEntry.aggregate(pipeline);

        res.status(200).json(entries);
    } catch (err) {
        console.error('Error in getAllDiaryEntries:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getAvailableFilters = async (req, res) => {
    try {
        const { tags, sources } = req.body;

        // Handle the 'all' case for Telegram sources
        const telegramSubtypes = SOURCE_SUBTYPES[SOURCE_TYPES.TELEGRAM].filter((subtype) => subtype !== 'all');
        const expandedSources = sources.flatMap((source) => (source === 'all' ? telegramSubtypes : source));

        let matchCondition = {};
        if (tags.length > 0) {
            matchCondition.tags = { $in: tags.map((tag) => new mongoose.Types.ObjectId(tag)) };
        }
        if (expandedSources.length > 0) {
            matchCondition.$or = [{ 'forward_origin.type': { $in: expandedSources } }, { 'forward_origin.subtype': { $in: expandedSources } }];
        }

        // Fetch available tags
        const availableTags = await DiaryEntry.distinct('tags', matchCondition);

        // Fetch available sources
        const sourceAggregation = await DiaryEntry.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: null,
                    types: { $addToSet: '$forward_origin.type' },
                    subtypes: { $addToSet: '$forward_origin.subtype' },
                },
            },
            {
                $project: {
                    sources: { $setUnion: ['$types', '$subtypes'] },
                },
            },
        ]);

        let availableSources = sourceAggregation[0]?.sources || [];

        // Add 'all' option if any Telegram subtype is present
        if (availableSources.some((source) => telegramSubtypes.includes(source))) {
            availableSources.push('all');
        }

        // If 'all' was in the original sources, ensure all Telegram subtypes are available
        if (sources.includes('all')) {
            availableSources = [...new Set([...availableSources, ...telegramSubtypes])];
        }

        res.status(200).json({
            availableTags,
            availableSources,
        });
    } catch (err) {
        console.error('Error in getAvailableFilters:', err);
        res.status(500).json({ message: err.message });
    }
};

// Получить одну запись
exports.getDiaryEntryById = async (req, res) => {
    try {
        const entry = await DiaryEntry.findById(req.params.id).populate('tags');
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.status(200).json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createDiaryEntry = async (req, res) => {
    const entry = new DiaryEntry(req.body);
    try {
        const newEntry = await entry.save();
        res.status(201).json(newEntry);

        // Notify clients about the new entry
        io.emit('updateEntries', newEntry);
    } catch (err) {
        // console.log(err);
        if (!res.headersSent) {
            res.status(400).json({ message: err.message });
        }
    }
};

// Обновить запись
exports.updateDiaryEntry = async (req, res) => {
    try {
        const updatedEntry = await DiaryEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEntry) return res.status(404).json({ message: 'Entry not found' });
        res.status(200).json(updatedEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Удалить запись
exports.deleteDiaryEntry = async (req, res) => {
    try {
        const entry = await DiaryEntry.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        // Получаем список тегов заметки
        const entryTags = entry.tags;

        // Удаляем заметку
        await DiaryEntry.findByIdAndDelete(req.params.id);

        // Проверяем каждый тег
        for (let tagId of entryTags) {
            // Проверяем, используется ли тег в других заметках
            const tagUsageCount = await DiaryEntry.countDocuments({ tags: tagId });
            if (tagUsageCount === 0) {
                // Если тег больше нигде не используется, удаляем его из базы данных
                await Tag.findByIdAndDelete(tagId);

                // Оповещаем клиентов об удалении тега
                // io.emit('deleteTag', tagId);
            }
        }

        // Оповещаем клиентов об удалении записи
        // io.emit('deleteEntry', req.params.id);

        res.status(200).json({ message: 'Entry deleted and unused tags cleaned up' });
    } catch (err) {
        console.error('Error in deleteDiaryEntry:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.uploadImageEntry = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const entry = await DiaryEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const filePath = file.path.replace(/\\/g, '/').replace(/^uploads/, '/uploads');
        const newImage = {
            path: filePath,
            fileName: file.originalname,
            dateAdded: new Date(),
            // diaryEntryId: entry._id,
            isHeaderImage: false,
        };

        entry.images.push(newImage);
        await entry.save();

        res.status(200).json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// delete image
exports.deleteImageEntry = async (req, res) => {
    try {
        const entry = await DiaryEntry.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        const imageIndex = entry.images.findIndex((image) => image._id.toString() === req.params.imageId);
        if (imageIndex === -1) return res.status(404).json({ message: 'Image not found' });

        // Получаем путь к файлу изображения
        const imagePath = path
            .join(__dirname, entry.images[imageIndex].path)
            .toString()
            .replace(/controllers[\\/]/, '');

        // Проверяем, используется ли этот файл в других записях
        const otherEntries = await DiaryEntry.find({
            _id: { $ne: req.params.id },
            'images.fileName': entry.images[imageIndex].fileName,
        });

        // Удаляем запись изображения из базы данных
        entry.images.splice(imageIndex, 1);
        await entry.save();

        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
        });

        res.status(200).json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// http://localhost:3500/api/diaryEntries/getDiaryDates
// [
// 	{
// 		"entries": [
// 			{
// 				"id": "66ac729a5a7d1c67bc7098e7",
// 				"title": "Пишу это ночью"
// 			}
// 		],
// 		"date": "2020-04-18"
// 	},

exports.getDiaryDates = async (req, res) => {
    try {
        const entries = await DiaryEntry.aggregate([
            {
                $addFields: {
                    createdAtDate: {
                        $cond: {
                            if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                            then: '$createdAt',
                            else: { $toDate: '$createdAt' },
                        },
                    },
                },
            },
            {
                $match: {
                    createdAtDate: { $ne: null },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAtDate' },
                    },
                    entries: {
                        $push: {
                            id: '$_id',
                            title: '$title',
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    entries: 1,
                },
            },
            {
                $sort: { date: 1 },
            },
        ]);

        res.status(200).json(entries);
    } catch (err) {
        console.error('Error in getDiaryDates:', err);
        res.status(500).json({ message: err.message });
    }
};
