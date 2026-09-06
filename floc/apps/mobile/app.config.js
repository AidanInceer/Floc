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
module.exports = ({ config }) => {
  if (!(process.env.EXPO_PUBLIC_API_URL ?? "").startsWith("http://")) return config;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
    ],
  };
};
