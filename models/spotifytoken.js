const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const spotifyTokenSchema = new Schema({
    token: {
        type: String,
        required: true
    }

})

const spotifyToken = mongoose.model('spotifytoken', spotifyTokenSchema);

module.exports = spotifyToken;
