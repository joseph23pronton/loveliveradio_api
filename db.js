import mongoose from "mongoose";
import {albumSchema} from "./schemas/album.js"
import {artistSchema} from "./schemas/artist.js"
import {memberSchema} from "./schemas/member.js";
import {songSchema} from "./schemas/song.js";
import {ENV} from "./config/config.js";

mongoose.connect(ENV.mongoURL).then(() => console.log("Connected to the DB"));

const albumModel = mongoose.model('Album', albumSchema)
const artistModel = mongoose.model('Artist', artistSchema)
const memberModel = mongoose.model('Member', memberSchema)
const songModel = mongoose.model('Song', songSchema)

mongoose.connection.on('error', () => {
    console.log("Error while connecting to DB")
})

export { albumModel, artistModel, memberModel, songModel }
