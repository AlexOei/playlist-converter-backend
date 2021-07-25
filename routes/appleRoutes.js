const express = require('express');
const mongoose = require('mongoose');
const router = express();
const fetch = require('node-fetch');
const isrc = require ('../models/isrc.js')
const servisongID = require('../models/songID.js');
const cors = require('cors');

router.use(cors());

const dbURI =process.env.dbURI

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true})
    .then((result)=> console.log('connected to db'))
    .catch((err)=> console.log(err));


router.post('/getAppleISRC', (req, res) => {
    let catalogID =0;//uses catalog id instead of library id
    const authToken = req.body.authToken.appleToken
    if (req.body.url.includes("pl.u")){
        preurl= 'https://api.music.apple.com/v1/catalog/us/playlists/'
        fullURL=preurl.concat(req.body.url)
        catalogID=1;
    }
    const getPlaylistTracks = async () =>{
        const preurl = 'https://api.music.apple.com/v1/me/library/playlists/'
        const lasturl = '/tracks?include=catalog'
        const fullURL = preurl.concat(req.body.url + lasturl)
        const songs = await fetch(fullURL,{
            method: 'GET',
            headers: {
                'authorization': process.env.appleAuth,
                'music-user-token': authToken
            }
        })
        console.log(songs)
        return songs.json()
    }

    const sendIsrc = async () => {
        const songs = await getPlaylistTracks()
        let total
        if (catalogID == 0){
            total=songs.meta.total
        }else if (catalogID == 1){
            total=songs.data[0].relationships.tracks.data.length
        }
        for(i = 0; i<total; i++){
            if (catalogID == 1){
                try{
                    var isISRC= songs.data[0].relationships.tracks.data[i].attributes.isrc
                    var trackN= songs.data[0].relationships.tracks.data[i].attributes.name
                    var albumN= songs.data[0].relationships.tracks.data[i].attributes.albumName
                } catch(err) {
                    console.log(err)
                }
                albumN= albumN.split(' - ')
                albumN= albumN[0]
            }
            else {
                try {
                    var isISRC = songs.data[i].relationships.catalog.data[0].attributes.isrc
                    var trackN = songs.data[i].attributes.name
                    var albumN = songs.data[i].attributes.albumName
                } catch (err) {
                    console.log(err)
                }
                albumN = albumN.split(' - ')
                albumN = albumN[0]
            }
            var isrcInstance = new isrc({
                isrc: isISRC,
                trackName: trackN,
                num: i,
                id: req.body.id.idA2S,
                album: albumN
            });

            isrcInstance.save()

        }
        console.log('isrc codes saved')
        res.send({done: 'done', status: '200'})

    }

    sendIsrc()

})


router.post('/createApplePlaylist', (req, res) =>{
    console.log('request started')
    const requestID = req.body.id.id
    const token = req.body.authToken.appleToken
    var playID = ''
    const playName = req.body.createplaylist
    var skipped = 0

    const deleteDb = async (result) => {
        if (result === false) {
            res.send({done: 'Sorry, an error ocurred, Please Try Again'})

        }
        isrc.deleteMany({id: requestID}, function (err, result){
            if (err) {
                console.log(err);
            }else{
                console.log("isrc db cleared")

            }
        })
        servisongID.deleteMany({id: requestID}, function (err, result){
            if (err) {
                console.log(err);
            } else{
                console.log("songid db cleared")

            }
        })

    }

    const createplaylist = async () =>{
        try{
            const createPlay = await fetch ('https://api.music.apple.com/v1/me/library/playlists/',{//create apple playlist
                method: 'POST',
                headers:{
                    'authorization': process.env.appleAuth,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'music-user-token':token
                },
                mode:'cors',
                body: JSON.stringify({
                    "attributes":{
                        "name" : playName,
                        "description": "Created by Playlist Converter"
                    }
                })
            })
            console.log(createPlay)
            return createPlay.json()
        }catch{
            await deleteDb(false)
        }


    }

    const numofIsrc = async () => {
        try{
            const playlist = await createplaylist()
            console.log(playlist)
            playID = playlist.data[0].id
            console.log(playID, 'playID')
            const numofSongs = await isrc.countDocuments({id: requestID})
            console.log(numofSongs, 'numofSongs')
            return numofSongs
        }catch{
            await deleteDb(false)
        }

    }


    const getAppleCode = async () => {
        const numofSongs = await numofIsrc()
        console.log(numofSongs+1, 'num of Songs')
        for (i = 0; i< numofSongs; i++){
            try{
                var isrcCodes = await isrc.find({id: requestID, num: i})
            }catch{
               continue
            }
            const preurl =  'https://api.music.apple.com/v1/catalog/us/songs?filter[isrc]='
            try{
                var isrcCode = isrcCodes[0].isrc
                var albumIsrc = isrcCodes[0].album
            } catch (err) {
                console.log(err)
                continue
            }

            const url = preurl.concat(isrcCode);
            const appleCode = await fetch(url,{
                method: 'GET',
                headers: {
                    'authorization': process.env.appleAuth
                },

            })


            var codes = await appleCode.json()
            if (codes.data.length === 0){
                console.log(isrcCodes[0].trackName, 'not found, skipped')
                skipped++
                continue
            }
            console.log(codes.data[0].attributes.name)

            let counter = 0
            try{
                var albumName = codes.data[0].attributes.albumName
                var duplicateSongs = codes.data.length
                var songName = codes.data[0].attributes.name
                var songID = codes.data[0].id
            } catch (err){
                console.log(err)
                continue
            }


            if (duplicateSongs > 1){

                albumName = albumName.split(' - ')
                albumName = albumName[0].split(' (EP)')
                albumName = albumName[0].toUpperCase();
                albumIsrc = albumIsrc.toUpperCase();


                if (albumName !== albumIsrc){
                    counter++;

                    albumName = codes.data[counter].attributes.albumName
                    albumName = albumName.split(' - ')
                    albumName = albumName[0].split(' (EP)')
                    albumName = albumName[0]
                    albumName = albumName.toUpperCase();
                    albumIsrc = albumIsrc.toUpperCase();
                    if (albumName === albumIsrc){
                        try{
                            name = codes.data[counter].attributes.name
                            id = codes.data[counter].id
                        } catch (err) {
                            console.log(err)
                        }
                    }

                }
            }

            var newSongId = new servisongID({
                songID: songID,
                num: i,
                name: songName,
                id: requestID
            })

            const transferred = await newSongId.save()
            await transferred

        }
        return true
    }


    const getnumofCodes = async () => {
        const prevhasFinished = await getAppleCode()

        if (prevhasFinished) {
            const numofSongIDs = await isrc.countDocuments({id: requestID})

            console.log(numofSongIDs, 'numofSongIds')
            return numofSongIDs
        }
    }

    const addSongs = async () => {
        const numofSongs = await getnumofCodes()
        for (i = 0; i<numofSongs; i++){
            try{
                var songID = await servisongID.find({id: requestID, num: i})
            }catch{
                continue
            }
            const playlistID = playID
            const tracks = "/tracks";
            const preUrl = 'https://api.music.apple.com/v1/me/library/playlists/'
            const url = preUrl.concat(playlistID, tracks)
            try{
                var id = songID[0].songID

            } catch(err){
                console.log(err)
                continue
            }
            console.log(songID[0].name, i)

            let songAdded = await fetch (url,{
                method: 'POST',
                headers: {
                    'authorization': process.env.appleAuth,
                    'music-user-token': token
                },
                body: JSON.stringify( {
                    "data":[{
                        "id": id,
                        "type":"songs"
                    }]
                })
            })

        }
        console.log('added' + (i-skipped) + 'tracks to playlist')
        return i-skipped
    }


    const finishRequest = async () => {
        const numofSongs = await addSongs()
        if (numofSongs !==0){
            res.send({done:("Done! Added " + numofSongs + " tracks to " + playName), link:"https://music.apple.com/library/playlist/"+playID})
            await deleteDb(true)

        } else{
           await deleteDb(false)
        }

    }



    finishRequest()

})
module.exports = router;
