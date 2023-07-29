const parseMember = (sourceRow) => {
    return {
        _id: sourceRow["id"],
        firstNameNat: sourceRow["firstNameNat"],
        lastNameNat: sourceRow["lastNameNat"],
        firstNameRom: sourceRow["firstNameRom"],
        lastNameRom: sourceRow["lastNameRom"],
        foreignNameOrder: sourceRow["foreignNameOrder"] === "TRUE"
    }
}

const parseArtist = (sourceRow) => {
    return {
        _id: sourceRow["id"],
        members: sourceRow["members"]? sourceRow["members"].split(",") : null,
        nameNat: sourceRow["nameNat"],
        nameRom: sourceRow["nameRom"]
    }
}

const parseAlbum = (sourceRow) => {
    return {
        _id: sourceRow["id"],
        titleNat: sourceRow["titleNat"],
        titleRom: sourceRow["titleRom"],
        artists: sourceRow["artists"]? sourceRow["artists"].split(",") : null,
        releaseDate: new Date(Date.parse(sourceRow["releaseDate"])),
        catalog: sourceRow["catalog"],
        subtitle: sourceRow["subtitle"],
        parent: sourceRow["parent"]
    }
}

const parseSong = (sourceRow) => {
    return {
        _id: sourceRow["id"],
        albumId: sourceRow["albumId"],
        albumOrder: sourceRow["albumOrder"]? parseInt(sourceRow["albumOrder"]) : null,
        titleNat: sourceRow["titleNat"],
        titleRom: sourceRow["titleRom"],
        artists: sourceRow["artists"]? sourceRow["artists"].split(",") : null,
        length: sourceRow["length"]? parseInt(sourceRow["length"]) : 0,
        isInstrumental: sourceRow["isInstrumental"] === "TRUE",
        isRadioDrama: sourceRow["isRadioDrama"] === "TRUE"
    }
}

export { parseMember, parseArtist, parseAlbum, parseSong }
