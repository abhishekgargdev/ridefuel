import mongoose from 'mongoose';

/**
 * Validates whether the provided URI has a valid MongoDB scheme.
 * Prevents Mongoose from throwing 'Invalid scheme, expected connection string to start with mongodb:// or mongodb+srv://'
 * when environment variables are truncated, misconfigured, or set to placeholder values.
 */
export function isValidMongoUri(uri?: string | null): uri is string {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  return trimmed.startsWith('mongodb://') || trimmed.startsWith('mongodb+srv://');
}

export function getMongoUri(): string | null {
  const uri = process.env.MONGODB_URI;
  if (isValidMongoUri(uri)) {
    return uri.trim();
  }
  return null;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  isConnected: boolean;
  lastAttemptTime: number;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  isConnected: false,
  lastAttemptTime: 0,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<{ isConnected: boolean; error?: string }> {
  // If already connected, return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    cached.isConnected = true;
    return { isConnected: true };
  }

  const validUri = getMongoUri();

  // If no valid MONGODB_URI configured, report fallback immediately without attempting connection or logging errors
  if (!validUri) {
    cached.isConnected = false;
    return { isConnected: false, error: 'No valid MONGODB_URI configured. Operating in repository mode.' };
  }

  // Cooldown backoff if connection recently failed (avoid connection delays on subsequent requests)
  const now = Date.now();
  if (!cached.isConnected && now - cached.lastAttemptTime < 15000 && !cached.promise) {
    return { isConnected: false, error: 'Reconnection cooldown in progress' };
  }

  if (!cached.promise) {
    cached.lastAttemptTime = now;
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2500,
      socketTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(validUri, opts)
      .then((mongooseInstance) => {
        cached.isConnected = true;
        console.log('[RideFuel] MongoDB connected successfully to database:', mongooseInstance.connection.name);
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        cached.isConnected = false;
        cached.lastAttemptTime = Date.now();
        console.info('[RideFuel] MongoDB connection unavailable, operating in resilient repository mode:', err?.message || 'offline');
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
    if (cached.conn && mongoose.connection.readyState === 1) {
      cached.isConnected = true;
      return { isConnected: true };
    }
  } catch {
    cached.conn = null;
    cached.promise = null;
    cached.isConnected = false;
    cached.lastAttemptTime = Date.now();
    return { isConnected: false, error: 'Database connection failed' };
  }

  return { isConnected: false, error: 'Database not connected' };
}

export function isDatabaseConnected(): boolean {
  return !!cached.conn && mongoose.connection.readyState === 1;
}
