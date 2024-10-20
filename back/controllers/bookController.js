const Book = require('../models/BookModel');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const cheerio = require('cheerio'); // Для парсинга HTML

// Upload a book
exports.uploadBook = async (req, res) => {
    try {
        console.log('Starting uploadBook controller');

        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = `/uploads/books/${req.file.filename}`;
        const absolutePath = path.join(__dirname, '..', filePath);

        console.log('File path:', absolutePath);

        // Проверка наличия файла
        if (!fs.existsSync(absolutePath)) {
            console.log('File does not exist');
            return res.status(400).json({ message: 'File does not exist' });
        }

        // Получаем размер файла
        const fileStats = fs.statSync(absolutePath);
        const fileSize = fileStats.size; // В байтах
        console.log('File size:', fileSize);

        // Распаковываем ePub-файл
        const zip = new AdmZip(absolutePath);
        const zipEntries = zip.getEntries();

        // Найти файл content.opf
        const opfEntry = zipEntries.find((entry) => entry.entryName.endsWith('.opf'));
        if (!opfEntry) {
            console.log('content.opf not found in ePub file');
            return res.status(400).json({ message: 'content.opf not found in ePub file' });
        }

        console.log('Found content.opf');

        const opfData = opfEntry.getData().toString('utf-8');

        // Парсинг XML
        const parser = new xml2js.Parser();
        const parsed = await parser.parseStringPromise(opfData);

        // Извлечение метаданных
        const metadata = parsed.package.metadata[0];
        const title = metadata['dc:title'] ? metadata['dc:title'][0] : 'Unknown Title';
        const author = metadata['dc:creator'] ? metadata['dc:creator'][0]._ || metadata['dc:creator'][0] : 'Unknown Author';
        const language = metadata['dc:language'] ? metadata['dc:language'][0] : 'Unknown Language';

        console.log('Extracted metadata:', { title, author, language });

        // Извлечение обложки
        let coverUrl = null;
        let coverId = null;
        if (metadata['meta']) {
            const coverMeta = metadata['meta'].find((meta) => meta.$.name === 'cover');
            if (coverMeta) {
                coverId = coverMeta.$.content;
            }
        }

        if (coverId) {
            const manifest = parsed.package.manifest[0].item;
            const coverItem = manifest.find((item) => item.$.id === coverId);
            if (coverItem) {
                const coverHref = coverItem.$.href;
                // Обложка может находиться в подкаталоге, например, OEBPS/images/cover.jpg
                const coverEntry = zipEntries.find((entry) => entry.entryName.endsWith(coverHref));
                if (coverEntry) {
                    const coverBuffer = coverEntry.getData();
                    const coverFilename = `${req.file.filename}-cover${path.extname(coverHref)}`;
                    const coverPath = `/uploads/covers/${coverFilename}`;
                    const absoluteCoverPath = path.join(__dirname, '..', coverPath);
                    fs.writeFileSync(absoluteCoverPath, coverBuffer);
                    coverUrl = coverPath;
                    console.log('Cover image extracted and saved:', coverUrl);
                } else {
                    console.log('Cover image file not found in ePub');
                }
            }
        }

        // Подсчёт количества слов и строк
        let wordCount = 0;
        let lineCount = 0;

        // Найти все xhtml/html файлы
        const xhtmlEntries = zipEntries.filter(
            (entry) => entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html') || entry.entryName.endsWith('.htm')
        );

        console.log('Number of xhtml entries:', xhtmlEntries.length);

        for (const entry of xhtmlEntries) {
            const content = entry.getData().toString('utf-8');
            const $ = cheerio.load(content);
            const text = $('body').text();
            const words = text
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0);
            wordCount += words.length;
            lineCount += text.trim().split(/\n+/).length;
        }

        console.log('Total word count:', wordCount);
        console.log('Total line count:', lineCount);

        // Создание нового документа Book
        const newBook = new Book({
            filePath,
            title,
            author,
            language,
            size: fileSize,
            uploadDate: new Date(),
            coverUrl,
            wordCount,
            lineCount,
        });

        await newBook.save();
        console.log('Book saved to database');

        res.json(newBook);
    } catch (error) {
        console.error('Error uploading book:', error);
        res.status(500).json({ message: 'Error uploading book', error: error.message });
    }
};

// Get all books
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching books', error });
    }
};

// Get a book by ID
exports.getBookById = async (req, res) => {
    try {
        // Найдем книгу в базе данных по ID
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const filePath = path.join(__dirname, '..', book.filePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Устанавливаем правильный заголовок для EPUB файла
        res.setHeader('Content-Type', 'application/epub+zip');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);

        // Отправляем файл как поток данных
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'Error fetching book', error });
    }
};

// Delete a book
exports.deleteBook = async (req, res) => {
    console.log(req.params.id);

    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Delete the file from the filesystem
        fs.unlinkSync(path.join(__dirname, '..', book.filePath));

        res.json({ message: 'Book deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting book', error });
    }
};
