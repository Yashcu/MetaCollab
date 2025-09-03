"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const User_1 = require("../models/User");
const config_1 = require("./config");
/**
 * Google OAuth Strategy
 */
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.config.google.clientId,
    clientSecret: config_1.config.google.clientSecret,
    callbackURL: config_1.config.google.callbackURL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error("No email found in Google profile"), false);
        }
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = await User_1.User.create({
            name: profile.displayName,
            email,
            oauthProvider: "google",
        });
        done(null, newUser);
    }
    catch (err) {
        done(err, false);
    }
}));
/**
 * GitHub OAuth Strategy
 */
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: config_1.config.github.clientId,
    clientSecret: config_1.config.github.clientSecret,
    callbackURL: config_1.config.github.callbackURL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error("No email found in GitHub profile"), false);
        }
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = await User_1.User.create({
            name: profile.displayName || profile.username,
            email,
            oauthProvider: "github",
        });
        done(null, newUser);
    }
    catch (err) {
        done(err, false);
    }
}));
