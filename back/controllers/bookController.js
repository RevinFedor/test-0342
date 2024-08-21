const Book = require('../models/BookModel');
const path = require('path');
const fs = require('fs');

// Upload a book
exports.uploadBook = async (req, res) => {
    try {
        const filePath = `/uploads/books/${req.file.filename}`;
        const newBook = new Book({ filePath });
        await newBook.save();
        res.json(newBook);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading book', error });
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
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
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
