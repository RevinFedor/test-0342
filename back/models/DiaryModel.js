// models/DiaryModel.js
const mongoose = require('mongoose');
const { FLAT_SOURCE_TYPES } = require('./sourceTypes');

const WeatherInfoSchema = new mongoose.Schema({
    date: Date,
    mainCondition: String,
    description: String,
    iconId: String,
    conditionId: Number,
    temperature: Number,
    sunrise: Date,
    sunset: Date,
    cloudiness: Number,
    windSpeed: Number,
    windDirection: Number,
});

const LocationSchema = new mongoose.Schema({
    address: String,
    latitude: Number,
    longitude: Number,
    dateCreated: Date,
});

const ImageSchema = new mongoose.Schema(
    {
        path: String,
        fileName: String,
        dateAdded: Date,
        diaryEntryId: Number,
        isHeaderImage: Boolean,
    },
    { _id: true }
);

const ForwardOriginSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: FLAT_SOURCE_TYPES,
        required: true,
    },
    subtype: {
        type: String,
        enum: FLAT_SOURCE_TYPES,
        required: false,
    },
    title: String,
    username: String,
    firstName: String,
    lastName: String,
    isHidden: Boolean,
    channelId: String,
    userId: String,
});

const DiaryEntrySchema = new mongoose.Schema({
    title: String,
    content: String,
    createdAt: Date,
    diaryDate: Date,
    weatherInfo: { type: WeatherInfoSchema, required: false },
    createdAtLocation: { type: LocationSchema, required: false },
    images: [ImageSchema],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], // Ссылки на теги
    forward_origin: ForwardOriginSchema,
});

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
