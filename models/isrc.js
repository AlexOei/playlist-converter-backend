const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const isrcSchema = new Schema({
    isrc: {
        type: String,
        required: true
    },

    trackName: {
        type: String,
        required: true
    },

    num:{
        type: String,
        required: true
    },

    id: {
        type: String,
        required: true
    },

    album: {
        type: String,
        required: true
    }
})

const isrc = mongoose.model('ISRC', isrcSchema);

module.exports = isrc;