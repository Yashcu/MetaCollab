import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { VerifyCallback } from "passport-oauth2";
import { User } from "../models/User";
import { config } from "./config";

/**
 * Google OAuth Strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = await User.create({
          name: profile.displayName,
          email,
          oauthProvider: "google",
        });
        done(null, newUser);
      } catch (err) {
        done(err as Error, false);
      }
    }
  )
);

/**
 * GitHub OAuth Strategy
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackURL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in GitHub profile"), false);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = await User.create({
          name: profile.displayName || profile.username,
          email,
          oauthProvider: "github",
        });
        done(null, newUser);
      } catch (err) {
        done(err as Error, false);
      }
    }
  )
);
