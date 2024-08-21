// telegramBot.js

const axios = require('axios');
const io = require('../index');

const createTagUrl = 'http://localhost:3500/api/diaryFilters/create/tagfortg';

// Функция для получения первых слов для title
exports.getFirstWords = (text, maxLength = 46) => {
    let words = text?.split(' ');
    let result = '';
    for (let word of words) {
        if ((result + word).length <= maxLength) {
            result += (result ? ' ' : '') + word;
        } else {
            break;
        }
    }
    return result;
};
// Функция для удаления хештегов из текста
exports.removeHashtags = (text) => {
    return text?.replace(/#[a-zA-Zа-яА-Я0-9_]+/g, '').trim();
};

// Функция для отправки тега на сервер
exports.sendTagToServer = async (tagName, entryId) => {
    try {
        const response = await axios.post(createTagUrl, { name: tagName, entryId });

        if (response.data && response.data.tag) {
            io.emit('updateTags', { tag: response.data.tag, entryId });
        }

        return response.data;
    } catch (error) {
        console.error('Error sending tag to server:', error);
        return null;
    }
};

// New function to process content

exports.processMessage = (msg) => {
    let text = msg.text || msg.caption || '';
    const entities = msg.entities || msg.caption_entities || [];

    // Сортируем сущности в обратном порядке, чтобы не нарушить индексы при вставке
    entities.sort((a, b) => b.offset - a.offset);

    entities.forEach((entity) => {
        if (entity.type === 'text_link') {
            const linkText = text.slice(entity.offset, entity.offset + entity.length);
            const markdownLink = `[${linkText}](${entity.url})`;
            text = text.slice(0, entity.offset) + markdownLink + text.slice(entity.offset + entity.length);
        } else if (entity.type === 'url') {
            const url = text.slice(entity.offset, entity.offset + entity.length);
            const markdownLink = `[${url}](${url})`;
            text = text.slice(0, entity.offset) + markdownLink + text.slice(entity.offset + entity.length);
        }
    });

    return text;
};
