const express = require('express');
const app = express();
const spotifyRoutes = require('./routes/spotifyRoutes.js');
const appleRoutes = require('./routes/appleRoutes.js');
const cors = require('cors');
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true}));
app.use(express.json({
    type:['application/json', 'text/plain']
}))

const PORT = process.env.PORT || 4000

app.listen(PORT);

app.use(appleRoutes);

app.use(spotifyRoutes);