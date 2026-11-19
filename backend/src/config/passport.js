import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import * as argon2 from 'argon2';
import prisma from './prisma.js';
import config from './env.js';

// 1. Local Strategy (Email & Password with Argon2id)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        const isMatch = await argon2.verify(user.passwordHash, password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// 2. JWT Strategy (Bearer Token)
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret,
    },
    async (jwtPayload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: jwtPayload.sub },
          select: {
            id: true,
            email: true,
            fullName: true,
            displayName: true,
            age: true,
            gender: true,
            collegeName: true,
            course: true,
            relationshipIntention: true,
            currentMood: true,
            subscriptionPlan: true,
            sentRequestsCount: true,
            avatarUrl: true,
          },
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

export default passport;
