import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { ARTIST_EMAIL_DOMAIN, MONGODB_DBNAME, MONGODB_URI, isArtistEmail } from './utils/config.js';

// Crea una cuenta de artista. Solo lo puede hacer alguien con acceso al backend.
// Uso: npm run user:create-artist --workspace backend -- <usuario> <correo@artista.cl> "<Nombre>" [contraseña]
// Sin contraseña en el comando, se pide por teclado y no se muestra (o se toma de ARTIST_PASSWORD).
const usage = `Uso: npm run user:create-artist --workspace backend -- <usuario> <correo@${ARTIST_EMAIL_DOMAIN}> "<Nombre>" [contraseña]`;

function askPassword(prompt: string): Promise<string> {
  if (process.env.ARTIST_PASSWORD) return Promise.resolve(process.env.ARTIST_PASSWORD);
  if (!process.stdin.isTTY) return Promise.reject(new Error('Ejecuta el comando en una terminal o define ARTIST_PASSWORD.'));

  // La pregunta va en su propia línea: la animación de npm borra la línea actual.
  process.stdout.write(`\n${prompt} (no se muestra al escribir; termina con Enter)\n`);
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', onData);
      process.stdout.write('\n');
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') { finish(); resolve(value); return; }
        if (char === '\u0003') { finish(); reject(new Error('Cancelado.')); return; }
        value = char === '\u007f' || char === '\b' ? value.slice(0, -1) : value + char;
      }
    };
    process.stdin.on('data', onData);
  });
}

const [rawUsername, rawEmail, rawName, rawPassword, ...extra] = process.argv.slice(2);
const username = rawUsername?.trim().toLowerCase() ?? '';
const email = rawEmail?.trim().toLowerCase() ?? '';
const name = rawName?.trim() ?? '';

if (!username || !email || !name || extra.length) {
  console.error(usage);
  process.exitCode = 1;
} else if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
  console.error('El usuario debe tener entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo.');
  process.exitCode = 1;
} else if (!isArtistEmail(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`El correo de un artista debe terminar en @${ARTIST_EMAIL_DOMAIN}.`);
  process.exitCode = 1;
} else {
  try {
    const password = rawPassword ?? await askPassword('Contraseña (8 a 128 caracteres):');
    if (password.length < 8 || password.length > 128) throw new Error('La contraseña debe tener entre 8 y 128 caracteres.');
    if (rawPassword === undefined && !process.env.ARTIST_PASSWORD && await askPassword('Repite la contraseña:') !== password) {
      throw new Error('Las contraseñas no coinciden.');
    }

    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DBNAME, serverSelectionTimeoutMS: 5000 });
    if (await User.exists({ $or: [{ username }, { email }] })) {
      throw new Error('Ya existe una cuenta con ese usuario o correo.');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, name, passwordHash, role: 'artista' });
    console.log(`Artista creado: ${user.username} (${user.email}). Ya puede iniciar sesión.`);
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'No se pudo crear el artista.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
