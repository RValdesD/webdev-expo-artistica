import 'dotenv/config';
import mongoose from 'mongoose';

// En el servidor del curso todos los grupos comparten la misma base de datos (`fullstack`).
// Con COLLECTION_PREFIX (por ejemplo `expo7037_`) nuestras colecciones quedan como
// `expo7037_users`, `expo7037_artists`, ... y no se mezclan con las de otros grupos.
// Cada modelo importa este archivo antes de llamar a model(), porque Mongoose fija el
// nombre de la colección al crear el modelo. Sin la variable, los nombres no cambian.
const prefix = (process.env.COLLECTION_PREFIX ?? '').trim();
const pluralize = mongoose.pluralize();

if (prefix && pluralize) mongoose.pluralize(name => prefix + pluralize(name));
