import mongoose from "mongoose";

export const artistSchema = new mongoose.Schema({
    _id: String,
    members: [String],
    nameNat: String,
    nameRom: String
})
