const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const { getFirstWords, removeHashtags, sendTagToServer, extractLinks, processContent, processMessage } = require('./utils');

const token = '7310878541:AAGWC1MI6EIRichrHN1BCZUbQ8N1RRfiHv8';
const bot = new TelegramBot(token, { polling: true });
const apiUrl = 'http://localhost:3500/api/diaryEntries';

function initBot() {
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const messageText = msg.caption || msg.text || '';
        const dateCreated = new Date(msg.date * 1000);

        // let forwardOrigin = {
        //     type: 'self',
        //     title: 'Администратор',
        // };
        let forwardOrigin = {
            type: 'user',
            title: 'Администратор',
        };

        if (msg.forward_from_chat) {
            // Forwarded from a channel
            forwardOrigin = {
                type: 'channel',
                title: msg.forward_from_chat.title,
                username: msg.forward_from_chat.username,
                channelId: msg.forward_from_chat.id.toString(),
            };
        } else if (msg.forward_from) {
            // Forwarded from a user
            forwardOrigin = {
                type: 'user',
                title: `${msg.forward_from.first_name} ${msg.forward_from.last_name || ''}`.trim(),
                username: msg.forward_from.username,
                firstName: msg.forward_from.first_name,
                lastName: msg.forward_from.last_name,
                userId: msg.forward_from.id.toString(),
            };
        } else if (msg.forward_sender_name) {
            // Forwarded from a user with hidden identity
            forwardOrigin = {
                type: 'hidden_user',
                title: msg?.forward_sender_name,
                isHidden: true,
            };
        }

        // Process the content
        const processedContent = processMessage(msg);

        console.log(processedContent);

        const noteObject = {
            id: messageId,
            title: getFirstWords(removeHashtags(messageText)),
            content: processedContent,
            createdAt: dateCreated.toISOString(),
            diaryDate: dateCreated.toISOString(),
            images: [],
            tags: [],
            forward_origin: forwardOrigin,
        };

        try {
            // Create the note
            const createdEntry = await axios.post(`${apiUrl}/createDiaryEntry`, noteObject);
            const entryId = createdEntry.data._id;

            // Process hashtags
            const hashtags = messageText.match(/#[a-zA-Zа-яА-Я0-9_]+(?!\S)/g);

            console.log(hashtags);
            if (hashtags) {
                for (const tag of hashtags) {
                    const tagName = tag.slice(1);
                    const result = await sendTagToServer(tagName, entryId);
                    if (result && result.tag) {
                        noteObject.tags.push(result.tag._id);
                    }
                }
            }

            // Update the note with new tags
            if (noteObject.tags.length > 0) {
                await axios.put(`${apiUrl}/${entryId}`, { tags: noteObject.tags });
            }

            bot.sendMessage(chatId, 'Сообщение успешно добавлено в заметки!');
        } catch (error) {
            console.error('Ошибка при отправке данных:', error.message);
            bot.sendMessage(chatId, 'Произошла ошибка при добавлении сообщения.');
        }
    });

    console.log('Telegram Bot is running...');
}

module.exports = initBot;
