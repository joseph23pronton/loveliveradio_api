import * as path from "path";
import mongoose from "mongoose";
import csvtojson from "csvtojson";
import { ENV } from "../config/config.js";
import { albumModel, artistModel, memberModel, songModel } from "../db.js"
import { parseMember, parseArtist, parseAlbum, parseSong } from "./initParser.js";

const csv_files = [
    ["members", path.resolve('init', 'data', 'members-data.csv')],
    ["artists", path.resolve('init', 'data', 'artists-data.csv')],
    ["albums", path.resolve('init', 'data', 'albums-data.csv')],
    ["songs", path.resolve('init', 'data', 'songs-data.csv')]
];

await mongoose.connect(ENV.mongoURL)
    .then(async () => {
        const function_start = performance.now()
        console.log("Connection to DB Established!")
        let update_count = 0;
        let insert_count = 0;
        for (const csv_file of csv_files) {
            let parser;
            let model;
            switch (csv_file[0]) {
                case "members": {
                    parser = parseMember;
                    model = memberModel;
                } break
                case "artists": {
                    parser = parseArtist;
                    model = artistModel;
                } break
                case "albums": {
                    parser = parseAlbum;
                    model = albumModel;
                } break
                case "songs": {
                    parser = parseSong;
                    model = songModel;
                } break
            }
            await csvtojson().fromFile(csv_file[1])
                .then(async source => {
                    await console.log(`-> Initializing ${csv_file[0]} collection... (${source.length})`)
                    let start = performance.now()
                    for (let i = 0; i < source.length; i++) {
                        let sourceRow = source[i];
                        let filter = { _id: sourceRow["id"] };
                        let doc = await model.collection.findOneAndUpdate(filter, { $set: await parser(sourceRow) }, {
                            upsert: true
                        });
                        doc["lastErrorObject"]["updatedExisting"]? update_count++ : insert_count++
                    }
                    let end = performance.now()
                    await console.log(`-> Done in ${Math.round((end - start) / 10) / 100}s. (Avg ${Math.round((end - start) / (10 * source.length)) / 100}s/op)`)
                });
        }
        const function_end = performance.now()
        await mongoose.disconnect().then(
            async () => {
                console.log(
                    `\nConnection to DB Terminated after updating ${update_count} and inserting ${insert_count} documents in ${Math.round((function_end - function_start) / 10) / 100}s.`
                )
            }
        )
    })
    .catch((error) => console.log(error.message));
