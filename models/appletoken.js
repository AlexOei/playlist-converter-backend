const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appleTokenSchema = new Schema({
    token: {
        type: String,
        required: true
    }

})

const appleToken = mongoose.model('appletoken', appleTokenSchema);

module.exports = appleToken;