const path = require('path');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();

async function processDatabaseFile(filePath, format) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(filePath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Database opened successfully.');
                exportWords(db, format)
                    .then(resolve)
                    .catch(reject)
                    .finally(() => {
                        db.close((err) => {
                            if (err) {
                                console.error('Error closing database:', err.message);
                            } else {
                                console.log('Database closed.');
                            }
                        });
                    });
            }
        });
    });
}

async function exportWords(db, format) {
    try {
        const categories = await getTableData(db, 'CATEGORY');
        const wordCategories = await getTableData(db, 'WORD_CATEGORY');
        const words = await getTableData(db, 'WORD');

        const targetCategories = categories.filter((cat) => cat.NAME_RUS === 'books' || cat.NAME_RUS === 'Свои слова');
        const targetWordIds = wordCategories.filter((wc) => targetCategories.some((tc) => tc.ID === wc.CATEGORY_ID)).map((wc) => wc.WORD_ID);
        const targetWords = words
            .filter((word) => targetWordIds.includes(word.ID))
            .map((word) => ({
                word: word.WORD,
                translation: word.RUS,
            }));

        let outputContent;
        if (format === 'csv') {
            outputContent = targetWords.map((w) => w.word).join(', ');
        } else {
            outputContent = targetWords.map((w) => `${w.word} - ${w.translation}`).join('\n');
        }

        return outputContent;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}

function getTableData(db, tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName};`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    processDatabaseFile,
};
