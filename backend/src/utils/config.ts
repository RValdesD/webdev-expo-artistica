import dotenv from "dotenv";
dotenv.config({ quiet: true });

const PORT = process.env.PORT;
const MONGODB_URI = process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_DB_NAME
    : process.env.MONGODB_DB_NAME;
const JWT_SECRET = process.env.JWT_SECRET;

if (!PORT) {
    throw new Error("PORT is not defined in the environment variables");
}

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in the environment variables");
}

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

export default { PORT, MONGODB_URI, MONGODB_DB_NAME, JWT_SECRET };
