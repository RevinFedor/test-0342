const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// MongoDB URI
const uri = 'mongodb://localhost:27017';
const dbName = 'diary';
const collectionName = 'diaryentries';
const tagCollectionName = 'tags';

// Путь к JSON файлу с данными
const dataFilePath = path.join(__dirname, 'DiaryApp.json');

// Создаем подключение к MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Функция для генерации случайных тегов
function generateTags(allTags, count) {
    return faker.helpers.arrayElements(allTags, { min: 1, max: count });
}

async function updateDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const tagCollection = db.collection(tagCollectionName);

        // Удаляем все существующие данные
        await db.dropDatabase();
        console.log('Existing database dropped');

        // Создаем новые коллекции
        await db.createCollection(collectionName);
        await db.createCollection(tagCollectionName);

        // Создаем теги
        const tagNames = [
            'работа',
            'отдых',
            'путешествия',
            'семья',
            'хобби',
            'спорт',
            'еда',
            'технологии',
            'книги',
            'музыка',
            'фильмы',
            'природа',
            'город',
            'здоровье',
            'финансы',
            'образование',
            'искусство',
            'друзья',
            'праздники',
            'планы',
        ];
        const tags = tagNames.map((name) => ({ _id: new ObjectId(), name, createdAt: faker.date.past() }));
        await tagCollection.insertMany(tags);
        console.log(`Inserted ${tags.length} tags`);

        // Читаем данные из JSON файла
        const rawData = fs.readFileSync(dataFilePath);
        const data = JSON.parse(rawData);

        // Удаляем поле `id` и добавляем `_id` для всех объектов
        data.forEach((entry) => {
            entry.forward_origin = {
                type: 'diary',
            };
            delete entry.id;
            entry._id = new ObjectId(); // Генерируем новый _id для основного объекта
            entry.createdAt = new Date(entry.createdAt);

            if (entry.images && entry.images.length > 0) {
                entry.images.forEach((image) => {
                    delete image.id;
                    image._id = new ObjectId(); // Генерируем новый _id для каждого изображения
                });
            }
        });

        // Вставляем данные из JSON файла
        await collection.insertMany(data);
        console.log(`Inserted ${data.length} documents from JSON file`);

        // Создаем дополнительные заметки
        const additionalEntries = Array.from({ length: 20 }, () => ({
            _id: new ObjectId(),
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraphs(),
            createdAt: faker.date.past(),
            diaryDate: faker.date.past(),
            tags: generateTags(tags, 3).map((tag) => tag._id),
            weatherInfo: {
                date: faker.date.past(),
                mainCondition: faker.helpers.arrayElement(['Sunny', 'Cloudy', 'Rainy', 'Snowy']),
                description: faker.lorem.sentence(),
                iconId: faker.string.alphanumeric(3),
                conditionId: faker.number.int({ min: 200, max: 800 }),
                temperature: faker.number.int({ min: -10, max: 35 }),
                sunrise: faker.date.past(),
                sunset: faker.date.future(),
                cloudiness: faker.number.int({ min: 0, max: 100 }),
                windSpeed: faker.number.int({ min: 0, max: 20 }),
                windDirection: faker.number.int({ min: 0, max: 360 }),
            },
            createdAtLocation: {
                address: faker.location.streetAddress(),
                latitude: faker.location.latitude(),
                longitude: faker.location.longitude(),
                dateCreated: faker.date.past(),
            },
            images: [],
            // images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
            //     _id: new ObjectId(),
            //     url: faker.image.business(1234, 2345),
            //     fileName: faker.system.fileName({ extensionCount: 1 }),
            //     dateAdded: faker.date.past(),
            //     isHeaderImage: faker.datatype.boolean(),
            // })),

            forward_origin: {
                type: 'editor',
            },
        }));

        // Вставляем дополнительные заметки
        await collection.insertMany(additionalEntries);
        console.log(`Inserted ${additionalEntries.length} additional documents`);
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

updateDatabase();
