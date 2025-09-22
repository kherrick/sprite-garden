module.exports = {
  globDirectory: "./",
  globPatterns: [
    "**/**.css",
    "**/**.html",
    "**/**.mjs",
    "**/**.js",
    "**/**.png",
  ],
  globIgnores: [
    "**/assets/**.gif",
    "**/bin/**",
    "**/node_modules/**",
    "service-worker.js",
    "workbox-*.cjs",
    "workbox-*.js",
  ],
  swDest: "./service-worker.js",
  // define runtime caching rules
  runtimeCaching: [
    {
      // match any request
      urlPattern: new RegExp("^.*$"),

      // apply a network-first strategy
      handler: "NetworkFirst",

      options: {
        // use a custom cache name
        cacheName: "sprite-garden-cache",

        expiration: {
          // 365 days
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
  ],
};
