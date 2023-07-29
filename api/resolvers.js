import { albumModel, artistModel, memberModel, songModel } from "../db.js"
import { dateScalar } from "./schemas.js";

export const resolvers = {
    Date: dateScalar,
    Query: {
        getAllMembers: async (parent, args) => {
            return memberModel.find()
        },
        getAllArtists: async (parent, args) => {
            return artistModel.find()
        },

        // Has Pagination, and Limits
        getAllAlbums: async (parent, args) => {
            const cursor = albumModel.find().sort({ releaseDate: args.sort? 1 : -1 , _id: 1 })
            return implementLimitAndPagination(cursor, args)
        },
        getAllAlbumsCount: async (parent, args) => {
            return albumModel.countDocuments({})
        },

        getAllSongs: async (parent, args) => {
            const cursor = songModel.find({
                $and: [
                    { isInstrumental: args.includeInstrumental? { $exists: true } : false },
                    { isRadioDrama: args.includeRadioDrama? { $exists: true } : false }
                ]
            }).sort({ releaseDate: args.sort? 1 : -1, _id: 1 })
            return implementLimitAndPagination(cursor, args)
        },
        getAllSongsCount: async (parent, args) => {
            return songModel.countDocuments({
                $and: [
                    { isInstrumental: args.includeInstrumental? { $exists: true } : false },
                    { isRadioDrama: args.includeRadioDrama? { $exists: true } : false }
                ]
            })
        },

        getAllSongsInAlbum: async (parent, args) => {
            return songModel.find({ albumId: args.albumId }).sort({ albumOrder: 1 })
        },

        getMemberById: async (parent, args) => {
            return memberModel.findById(args.id);
        },
        getArtistById: async (parent, args) => {
            return artistModel.findById(args.id);
        },
        getAlbumById: async (parent, args) => {
            return albumModel.findById(args.id);
        },
        getSongById: async (parent, args) => {
            return songModel.findById(args.id);
        },

        findSongsByName: async (parent, args) => {
            const rgx = new RegExp(`.*${args.name}.*`);
            const filter = {
                $and: [
                    {
                        $or: [
                            {titleRom: {$regex: rgx, $options: "i"}},
                            {titleNat: {$regex: rgx, $options: "i"}}
                        ]
                    },
                    { isInstrumental: args.includeInstrumental? { $exists: true } : false },
                    { isRadioDrama: args.includeRadioDrama? { $exists: true } : false }
                ]
            }
            const cursor = songModel.find(filter).sort({releaseDate: args.sort? 1 : -1})
            return implementLimitAndPagination(cursor, args)
        },
        // TODO: Count Above

        findSongsByArtist: async (parent, args) => {
            const songFilter = {
                $and: [
                    { artists: args.artistId },
                    { isInstrumental: args.includeInstrumental? { $exists: true } : false },
                    { isRadioDrama: args.includeRadioDrama? { $exists: true } : false }
                ]
            }
            let songArray = await songModel.find(songFilter).populate('albumId')
            songArray.sort((first, second) => {
                return ((args.sort? 1 : -1) * Number(first.albumId.releaseDate) + (args.sort? -1 : 1) * Number(second.albumId.releaseDate))
            })
            if (args.limit !== 0) {
                return songArray.slice(0, args.limit)
            } else if (args.page !== 0 && args.pageLimit !== 0) {
                return songArray.slice((args.page - 1) * args.pageLimit, args.page * args.pageLimit)
            } else {
                return songArray
            }
        },
        // TODO: Count Above

        // TODO: findAlbumsByName (Paginated, Limited)
        // TODO: findAlbumsByArtist (Paginated, Limited)
    },
    Artist: {
        members: async (parent) => {
            let member_array = []
            for (let member of parent.members) {
                member_array.push( new Promise ((resolve, reject) => {
                    memberModel.findById(member, (err, document) => {
                        if (err) reject(err);
                        else resolve(document)
                    })
                }))
            }
            return member_array
        }
    },
    Song: {
        inAlbum: async (parent) => {
            let filter = {
                _id: parent.albumId
            }
            return albumModel.findOne(filter);
        },
        artists: async (parent) => {
            return getArtists(parent)
        }
    },
    Album: {
        artists: async (parent) => {
            return getArtists(parent)
        },
        songs: async (parent) => {
            return songModel.find({albumId: parent.id});
        }
    }
}

const getArtists = (parent) => {
    if (parent.artists) {
        let artist_array = []
        for (let artist of parent.artists) {
            artist_array.push( new Promise ((resolve, reject) => {
                artistModel.findById(artist, (err, document) => {
                    if (err) reject(err);
                    else resolve(document)
                })
            }))
        }
        return artist_array
    } else {
        return []
    }
}

const implementLimitAndPagination = (cursor, args) => {
    if (args.limit !== 0) {
        return cursor.limit(args.limit)
    } else if (args.page !== 0 && args.pageLimit !== 0) {
        let toSkip = (args.page - 1) * args.pageLimit
        return cursor.skip(toSkip >= 0? toSkip:0).limit(args.pageLimit)
    } else {
        return cursor
    }
}
