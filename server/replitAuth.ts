import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";

// Configurazione ambiente universale
const environment = {
  isReplit: !!process.env.REPL_ID,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 settimana
  
  // Configurazione session universale
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'universal-dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: !environment.isProduction, // true per sviluppo, false per produzione
    cookie: {
      httpOnly: true,
      secure: environment.isProduction, // HTTPS solo in produzione
      maxAge: sessionTtl,
    },
  };

  // Se siamo in produzione con database PostgreSQL, usa store persistente
  if (environment.isProduction && process.env.DATABASE_URL?.includes('postgres')) {
    try {
      const connectPg = require('connect-pg-simple');
      const pgStore = connectPg(session);
      const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true, // Crea tabella se non esiste
        ttl: sessionTtl,
        tableName: "sessions",
      });
      return session({ ...sessionConfig, store: sessionStore });
    } catch (error) {
      console.warn('⚠️ PostgreSQL session store fallback to memory:', error.message);
    }
  }

  // Fallback a session in memoria (sviluppo o fallback)
  console.log(`🔧 Using memory session store (${environment.isDevelopment ? 'development' : 'fallback'})`);
  return session(sessionConfig);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup autenticazione Replit solo se necessario
  if (environment.isReplit && process.env.REPLIT_DOMAINS) {
    console.log('🔐 Setting up Replit authentication...');
    try {
      await setupReplitAuth(app);
    } catch (error) {
      console.warn('⚠️ Replit auth setup failed, continuing without:', error.message);
    }
  } else {
    console.log('🔧 Skipping Replit authentication - using universal auth');
  }
}

async function setupReplitAuth(app: Express) {
  try {
    const client = await import("openid-client");
    const { Strategy } = await import("openid-client/passport");
    
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );

    const verify = async (tokens: any, verified: any) => {
      const user = { tokens, claims: tokens.claims() };
      verified(null, user);
    };

    for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: any, done) => done(null, user));
    passport.deserializeUser((obj: any, done) => done(null, obj));
  } catch (error) {
    console.warn('⚠️ Replit auth modules not available:', error.message);
  }
}

// Middleware di autenticazione universale
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // In development mode, always allow access with dev user
  if (process.env.NODE_ENV === 'development' && !process.env.REPL_ID) {
    // Set dev user if not already set
    if (!req.user) {
      req.user = {
        id: 'dev-user-123',
        claims: { sub: 'dev-user-123' },
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@example.com',
        profileImageUrl: 'https://via.placeholder.com/150',
      };
    }
    return next();
  }

  // Produzione: verifica autenticazione reale
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      environment: environment.isDevelopment ? 'development' : 'production'
    });
  }

  // Verifica token refresh se necessario (solo per Replit)
  if (environment.isReplit && (req.user as any).tokens?.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > (req.user as any).tokens.expires_at && (req.user as any).tokens.refresh_token) {
      try {
        // Refresh token logic here
        console.log('🔄 Token refresh needed');
      } catch (error) {
        console.warn('⚠️ Token refresh failed:', error.message);
      }
    }
  }

  next();
};

// Middleware di autenticazione opzionale
export const optionalAuth: RequestHandler = (req, res, next) => {
  if (environment.isDevelopment && !req.user) {
    req.user = {
      id: 'anonymous-user',
      email: 'anonymous@example.com',
      firstName: 'Anonymous',
      lastName: 'User'
    };
  }
  next();
};

export { environment };