import mongoose from 'mongoose';
import { Workshop } from './models/Workshop.js';
import { MONGODB_URI, MONGODB_DBNAME } from './utils/config.js';

// Quita las inscripciones del Hito 1 que no tienen userId: ocupan cupos y nadie puede cancelarlas.
// Uso: npm run registrations:clean --workspace backend            (solo muestra cuántas hay)
//      npm run registrations:clean --workspace backend -- --apply (las borra)
const apply = process.argv.includes('--apply');
const legacy = { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] };

try {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
  const workshops = await Workshop.find({ registrations: { $elemMatch: legacy } }).select('+registrations').lean();
  let total = 0;
  for (const workshop of workshops) {
    const count = workshop.registrations.filter(item => !item.userId).length;
    total += count;
    console.log(`${workshop.id}: ${count} inscripción(es) sin usuario`);
  }
  if (total === 0) console.log('No hay inscripciones sin usuario.');
  else if (!apply) console.log(`Total: ${total}. Nada se borró; agrega -- --apply para borrarlas.`);
  else {
    // updateMany con $pull no pasa por los validadores del documento, así no falla por las inscripciones viejas.
    await Workshop.updateMany({}, { $pull: { registrations: legacy } });
    console.log(`Se borraron ${total} inscripción(es) sin usuario.`);
  }
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
