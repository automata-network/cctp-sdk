module.exports = {
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      },
      cache: false,
      watchOptions: {
        ignored: ["node_modules/@automata-network/cctp-sdk"],
      },
    },
  },
};
