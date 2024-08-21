const fs = require('fs').promises;
const path = require('path');

async function exportWords() {
    try {
        // Определение путей к файлам относительно текущего скрипта
        const scriptDir = __dirname;
        const wordPath = path.join(scriptDir, 'WORD.json');
        const wordCategoryPath = path.join(scriptDir, 'WORD_CATEGORY.json');
        const categoryPath = path.join(scriptDir, 'CATEGORY.json');
        const outputPath = path.join(scriptDir, 'exported_words.txt');

        // Чтение JSON файлов
        const words = JSON.parse(await fs.readFile(wordPath, 'utf8'));
        const wordCategories = JSON.parse(await fs.readFile(wordCategoryPath, 'utf8'));
        const categories = JSON.parse(await fs.readFile(categoryPath, 'utf8'));

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

        // Создание директории для выходного файла, если она не существует
        await fs.mkdir(path.dirname(outputPath), { recursive: true });

        // Запись результата в файл без транскрипции
        await fs.writeFile(outputPath, targetWords.map((w) => `${w.word} - ${w.translation}`).join('\n'));

        console.log(`Слова успешно экспортированы в файл ${outputPath}`);
    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
}

exportWords();
