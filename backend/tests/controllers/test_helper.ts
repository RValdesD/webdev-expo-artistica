import { Artist } from "../../src/models/artists.ts";
import { Artwork } from "../../src/models/artworks.ts";
import { Workshop } from "../../src/models/workshops.ts";
import { Expo } from "../../src/models/expo.ts";
import { sampleExpo } from "../../src/data/sampleExpo.ts";

// Datos chicos y conocidos. Luis Soto no tiene obras ni talleres,
// así que se puede eliminar; Ana Pérez sí tiene, así que no.
const initialArtists = [
    { id: "ana-perez", name: "Ana Pérez", bio: "Pintora de paisajes marinos.", discipline: "Pintura" },
    { id: "luis-soto", name: "Luis Soto", bio: "Escultor en madera.", discipline: "Escultura" },
];

const initialArtworks = [
    { id: "mar-azul", title: "Mar azul", artistId: "ana-perez", medium: "Pintura", year: 2024 },
    { id: "ola-quieta", title: "Ola quieta", artistId: "ana-perez", medium: "Pintura", year: 2025 },
];

const initialWorkshops = [
    {
        id: "acuarela",
        title: "Acuarela marina",
        description: "Introducción a la acuarela.",
        artistId: "ana-perez",
        date: new Date("2099-06-01T15:00:00Z"),
        durationMinutes: 90,
        location: "Sala A",
        capacity: 3,
    },
];

// Vacía la base de tests y la deja con los datos iniciales.
const resetDb = async () => {
    await Promise.all([
        Artist.deleteMany({}),
        Artwork.deleteMany({}),
        Workshop.deleteMany({}),
        Expo.deleteMany({}),
    ]);
    await Artist.insertMany(initialArtists);
    await Artwork.insertMany(initialArtworks);
    await Workshop.insertMany(initialWorkshops);
    await new Expo(sampleExpo).save();
};

const artistsInDb = () => Artist.find({}).lean();
const artworksInDb = () => Artwork.find({}).lean();
const workshopsInDb = () => Workshop.find({}).select("+registrations").lean();

export default {
    initialArtists,
    initialArtworks,
    initialWorkshops,
    resetDb,
    artistsInDb,
    artworksInDb,
    workshopsInDb,
};
