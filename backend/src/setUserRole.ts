import mongoose from 'mongoose';
import { User } from './models/User.js';
import { ADMIN_EMAIL_DOMAIN, MONGODB_URI, MONGODB_DBNAME, isAdminEmail } from './utils/config.js';

// Only an operator with backend/database access can run this command.
// Usage: npm run user:role --workspace backend -- ana organizador
const [username, role, ...extra] = process.argv.slice(2);
if (!username || !['visitante', 'organizador'].includes(role) || extra.length) {
  console.error('Uso: npm run user:role --workspace backend -- <usuario> <visitante|organizador>');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
    const current = await User.findOne({ username: username.trim().toLowerCase() });
    if (!current) throw new Error('Usuario no encontrado. Crea primero la cuenta desde /registro.');
    // Organizador = correo del dominio admin. Para cuentas nuevas, usar user:create-admin.
    if (role === 'organizador' && !isAdminEmail(current.email ?? '')) {
      throw new Error(`Solo un correo @${ADMIN_EMAIL_DOMAIN} puede ser organizador. Crea la cuenta con npm run user:create-admin.`);
    }
    const user = await User.findOneAndUpdate(
      { _id: current._id },
      { $set: { role } },
      { new: true, runValidators: true },
    );
    if (!user) throw new Error('Usuario no encontrado.');
    console.log(`Rol de ${user.username}: ${user.role}. Recarga la página para actualizar el menú.`);
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'No se pudo cambiar el rol.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
