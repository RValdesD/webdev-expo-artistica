import mongoose from 'mongoose';
import { User } from './models/User.js';
import { MONGODB_URI, MONGODB_DBNAME } from './utils/config.js';

// Only an operator with backend/database access can run this command.
// Usage: npm run user:role --workspace backend -- ana organizador
const [username, role, ...extra] = process.argv.slice(2);
if (!username || !['visitante', 'organizador'].includes(role) || extra.length) {
  console.error('Uso: npm run user:role --workspace backend -- <usuario> <visitante|organizador>');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
    const user = await User.findOneAndUpdate(
      { username: username.trim().toLowerCase() },
      { $set: { role } },
      { new: true, runValidators: true },
    );
    if (!user) throw new Error('Usuario no encontrado. Crea primero la cuenta desde /registro.');
    console.log(`Rol de ${user.username}: ${user.role}. Recarga la página para actualizar el menú.`);
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'No se pudo cambiar el rol.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
