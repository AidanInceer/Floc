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

function withFirebase(config) {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
  };
}

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
