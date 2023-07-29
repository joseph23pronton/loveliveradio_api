import mongoose from "mongoose";

export const albumSchema = new mongoose.Schema({
    _id: String,
    titleNat: String,
    titleRom: String,
    artists: [String],
    releaseDate: {
        type: Date,
        default: Date.now()
    },
    catalog: String,
    subtitle: String,
    parent: String
})
