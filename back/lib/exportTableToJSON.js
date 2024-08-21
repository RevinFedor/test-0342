const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

// Открытие базы данных
const dbFilePath = path.join(__dirname, 're.backup');
const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
        console.error('Ошибка при открытии базы данных:', err.message);
    } else {
        console.log('База данных успешно открыта.');
        exportWords();
    }
});

// Определение формата вывода: "text" - для построчного вывода с переводом, "csv" - для вывода слов через запятую
const outputFormat = 'text';
// csv

async function exportWords() {
    try {
        // Определение пути для сохранения результата
        const outputPath = path.join(__dirname, 'exported_words.txt');

        // Получение всех категорий
        const categories = await getTableData('CATEGORY');
        const wordCategories = await getTableData('WORD_CATEGORY');
        const words = await getTableData('WORD');

        // Фильтрация нужных категорий
        const targetCategories = categories.filter((cat) => cat.NAME_RUS === 'books' || cat.NAME_RUS === 'Свои слова');

        // Получение ID слов для выбранных категорий
        const targetWordIds = wordCategories.filter((wc) => targetCategories.some((tc) => tc.ID === wc.CATEGORY_ID)).map((wc) => wc.WORD_ID);

        // Фильтрация и форматирование целевых слов
        const targetWords = words
            .filter((word) => targetWordIds.includes(word.ID))
            .map((word) => ({
                word: word.WORD,
                translation: word.RUS,
            }));

        // Форматирование результата в зависимости от выбранного формата
        let outputContent;
        if (outputFormat === 'csv') {
            outputContent = targetWords.map((w) => w.word).join(', ');
        } else {
            // outputFormat === "text"
            outputContent = targetWords.map((w) => `${w.word} - ${w.translation}`).join('\n');
        }

        // Создание директории для выходного файла, если она не существует
        await fs.mkdir(path.dirname(outputPath), { recursive: true });

        // Запись результата в файл
        await fs.writeFile(outputPath, outputContent);

        console.log(`Слова успешно экспортированы в файл ${outputPath}`);
    } catch (error) {
        console.error('Произошла ошибка:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Ошибка при закрытии базы данных:', err.message);
            } else {
                console.log('База данных закрыта.');
            }
        });
    }
}

function getTableData(tableName) {
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
