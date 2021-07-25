const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const songIDSchema = new Schema({
    songID: {
        type: String,
        required: true
    },
    num: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    }

})

const servisongID = mongoose.model('songID', songIDSchema);

module.exports = servisongID;