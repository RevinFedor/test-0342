// sourceTypes.js (общий файл для фронтенда и бэкенда)

const SOURCE_TYPES = {
    TELEGRAM: 'telegram',
    DIARY: 'diary',
    EDITOR: 'editor',
};

const SOURCE_SUBTYPES = {
    [SOURCE_TYPES.TELEGRAM]: ['channel', 'user', 'hidden_user'],
    [SOURCE_TYPES.DIARY]: ['diary'],
    [SOURCE_TYPES.EDITOR]: ['editor'],
};

// Это массив, который включает в себя все типы и подтипы в одном уровне:
// [
//     'telegram', 'channel', 'user', 'hidden_user',
//     'diary', 'diary',
//     'editor', 'editor'
// ]

const FLAT_SOURCE_TYPES = Object.values(SOURCE_TYPES).reduce((acc, type) => {
    return [...acc, type, ...SOURCE_SUBTYPES[type]];
}, []);

module.exports = {
    SOURCE_TYPES,
    SOURCE_SUBTYPES,
    FLAT_SOURCE_TYPES,
};
