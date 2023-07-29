import mongoose from "mongoose";

export const memberSchema = new mongoose.Schema({
    _id: String,
    firstNameNat: String,
    lastNameNat: String,
    firstNameRom: String,
    lastNameRom: String,
    foreignNameOrder: Boolean
})
