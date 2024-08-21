const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3500;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    },
});

mongoose
    .connect('mongodb://localhost:27017/diary', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB', err));

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        // console.log('Client disconnected');
    });
});

module.exports = io;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const diaryEntriesRoutes = require('./routes/diaryEntries');
const diaryFiltersRoutes = require('./routes/diaryFilters');
const bookRoutes = require('./routes/books');

app.use('/api/diaryEntries', diaryEntriesRoutes);
app.use('/api/diaryFilters', diaryFiltersRoutes);
app.use('/api/books', bookRoutes);

// Инициализация Telegram бота
const initBot = require('./botTelegram/telegramBot');
initBot();

// ! вывести в отедльные папки и роуткры
// Обработка загрузки файла reword

const { uploadEntryImage } = require('./upload');

app.post('/upload', uploadEntryImage.single('file'), async (req, res) => {
    if (!req.file || !req.body.format) {
        return res.status(400).send('No file or format specified.');
    }

    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const outputFormat = req.body.format;

    try {
        const result = await processDatabaseFile(filePath, outputFormat);

        res.setHeader('Content-Disposition', 'attachment; filename=exported_words.txt');
        res.setHeader('Content-Type', 'text/plain');
        res.send(result);
    } catch (error) {
        res.status(500).send('Error processing file.');
    } finally {
        try {
            await fs.unlink(filePath);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
    }
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
