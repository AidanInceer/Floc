/**
 * Cleartext, only while the API is cleartext (ticket 289).
 *
 * Android 9 and later refuse plain `http://` from a release build unless the
 * manifest opts in, and refuse it silently — the request never leaves the
 * phone, so a dev server sees nothing and the app hangs. A phone reaching a
 * dev server by LAN address has no TLS to use, hence the opt-in.
 *
 * Tied to the URL rather than the build profile so it cannot outlive its
 * reason: point the app at an https API and the exemption disappears.
 */
function withCleartext(config) {
  if (!(process.env.EXPO_PUBLIC_API_URL ?? "").startsWith("http://")) return config;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
      "expo-sharing",
    ],
  };
}

/** Why: the Firebase file is kept out of git, so EAS hands it over as the GOOGLE_SERVICES_JSON file variable (#345). */
function withFirebase(config) {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
  };
}

/** Why: a link to the site opens the app only once the site vouches for it, and only an https site can (#346). */
function withAppLinks(config) {
  const host = (process.env.EXPO_PUBLIC_API_URL ?? "").match(/^https:\/\/([^/?#]+)/)?.[1];
  if (!host) return config;

  return {
    ...config,
    ios: { ...config.ios, associatedDomains: [`applinks:${host}`] },
    android: {
      ...config.android,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host, pathPrefix: "/trip/" },
            { scheme: "https", host, path: "/friends" },
            { scheme: "https", host, path: "/inbox" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
  };
}

module.exports = ({ config }) => withAppLinks(withFirebase(withCleartext(config)));
