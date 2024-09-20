import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  UserLoginType,
} from "../secrets";
import { prismaClient } from "..";
import { AvailableSocialLogins, User } from "@prisma/client";
export const passportInitialize = (passport: any) => {
  // Serialize user into session
  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done: any) => {
    try {
      const user = await prismaClient.user.findUnique({
        where: { id },
      });
      if (user) {
        done(null, user);
      } else {
        done(new Error("User does not exist"), null);
      }
    } catch (error) {
      done(new Error(`Error during deserialization: ${error}`), null);
    }
  });

  // Register the Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL:
          GOOGLE_CALLBACK_URL ||
          "http://localhost:8000/api/v1/users/google/callback",
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: any
      ) => {
        try {
          const user = await prismaClient.user.findUnique({
            where: { email: profile._json.email },
          });

          if (user) {
            if (user.loginType !== UserLoginType.GOOGLE) {
              done(
                new Error(
                  `You have previously registered using ${user.loginType
                    ?.toLowerCase()
                    ?.split("_")
                    .join(" ")}. Please use the same login option.`
                ),
                null
              );
            } else {
              done(null, user); // User exists, return the user
            }
          } else {
            // User does not exist, create a new one
            const newUser = await prismaClient.user.create({
              data: {
                email: profile._json.email as string,
                password: profile._json.sub, // Set to null for OAuth users
                name: profile._json.email?.split("@")[0] as string,
                loginType: AvailableSocialLogins.GOOGLE,
              },
            });
            done(null, newUser);
          }
        } catch (error) {
          done(new Error("Error during Google authentication: " + error), null);
        }
      }
    )
  );
};
