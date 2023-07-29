import { gql } from "apollo-server-express";
import { Kind, GraphQLScalarType } from "graphql";

export const typeDefs = gql`
    scalar Date
    
    type Member {
        id: String!
        firstNameNat: String!
        lastNameNat: String!
        firstNameRom: String
        lastNameRom: String
        foreignNameOrder: Boolean!
    }
    
    type Artist {
        id: String!
        members: [Member]!
        nameNat: String
        nameRom: String
    }
    
    type Song {
        id: String!
        inAlbum: Album!
        albumOrder: Int!
        titleNat: String
        titleRom: String
        artists: [Artist]
        length: Int!
        isInstrumental: Boolean!
        isRadioDrama: Boolean!
    }

    type Album {
        id: String!
        titleNat: String!
        titleRom: String
        songs: [Song]
        artists: [Artist]!
        releaseDate: Date!
        catalog: String
        subtitle: String
        parent: String!
    }
    
    type Query {
        getAllMembers: [Member]
        getAllArtists: [Artist]
        
        getAllSongs (
            includeInstrumental: Boolean = false,
            includeRadioDrama: Boolean = false,
            sort: Boolean = true,
            limit: Int = 0,
            page: Int = 0,
            pageLimit: Int = 0
        ): [Song]
        
        getAllSongsCount (
            includeInstrumental: Boolean = false,
            includeRadioDrama: Boolean = false): Int
        
        
        getAllAlbums (
            sort: Boolean = true, 
            limit: Int = 0,
            page: Int = 0,
            pageLimit: Int = 0
        ): [Album]

        getAllAlbumsCount: Int
        
        
        getAllSongsInAlbum(albumId: String!): [Song]
        
        getMemberById(id: String!): Member
        getArtistById(id: String!): Artist
        getAlbumById(id: String!): Album
        getSongById(id: String!): Song
        
        findSongsByName (
            name: String!,
            includeInstrumental: Boolean = false,
            includeRadioDrama: Boolean = false,
            sort: Boolean = true,
            limit: Int = 0,
            page: Int = 0,
            pageLimit: Int = 0
        ): [Song]
        
        findSongsByNameCount (name: String!,
            includeInstrumental: Boolean = false,
            includeRadioDrama: Boolean = false): Int
        
        findSongsByArtist (
            artistId: String!,
            includeInstrumental: Boolean = false,
            includeRadioDrama: Boolean = false,
            sort: Boolean = true,
            limit: Int = 0,
            page: Int = 0,
            pageLimit: Int = 0
        ): [Song]
        
        findSongsByArtistCount (artistId: String!,
            includeInstrumental: Boolean = false,
            includeRadioDrama: Boolean = false): Int
        
        findAlbumsByName (
            name: String!,
            sort: Boolean = true,
            limit: Int = 0,
            page: Int = 0,
            pageLimit: Int = 0
        ): [Album]
        
        findAlbumsByNameCount (name: String!): Int
        
        findAlbumsByArtist (
            artistId: String!,
            sort: Boolean = true,
            limit: Int = 0,
            page: Int = 0,
            pageLimit: Int = 0
        ): [Album]
        
        findAlbumsByArtistCount (artistId: String!): Int
        
#        findAlbumsByDate(
#            since: Int, until: Int,
#            sort: Boolean = true,
#            limit: Int = 0
#        ): [Album]
#        
#        findAlbumsByParent(
#            parent: String!,
#            sort: Boolean = true,
#            limit: Int = 0
#        ): [Album]
#        
#        findAlbumByCatalog(
#            catalog: String!,
#            sort: Boolean = true,
#            limit: Int = 0
#        ): Album
    }
`

export const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date scalar type',
    serialize(value) {
        return value.getTime();
    },
    parseValue(value) {
        return new Date(value);
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
            return new Date(parseInt(ast.value, 10));
        }
        return null;
    },
});
