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
          include: {
            profile: true,
            education: true,
            photos: { orderBy: { photoOrder: 'asc' } },
          },
        });

        if (!user) {
          return done(null, false);
        }

        const p = user.profile || {};
        const edu = user.education || {};
        const photoUrls = (user.photos || []).map((ph) => ph.photoUrl);
        const avatarUrl = photoUrls[0] || null;

        const sanitized = {
          id: user.id,
          email: user.email,
          mobileNumber: user.mobileNumber,
          fullName: user.fullName,
          displayName: user.displayName,
          age: user.age,
          gender: user.gender,
          accountStatus: user.accountStatus,
          role: user.role,
          verificationStatus: user.verificationStatus,
          subscriptionPlan: user.subscriptionPlan,
          sentRequestsCount: user.sentRequestsCount,
          collegeName: edu.collegeName || null,
          universityName: edu.universityName || null,
          course: edu.degreeName || edu.departmentStream || null,
          relationshipIntention: p.relationshipIntention || 'Casual Connection',
          currentMood: p.currentMood || 'Want to make friends',
          bio: p.bio || null,
          interests: p.interests || [],
          avatarUrl,
          additionalPhotos: photoUrls.slice(1),
        };

        return done(null, sanitized);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

export default passport;
