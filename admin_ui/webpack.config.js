const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (_env, argv) => {
  const mode = argv.mode || "development";
  const isProd = mode === "production";

  return {
    mode,
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "static/js/bundle.js",
      assetModuleFilename: "static/media/[name][ext][query]",
      publicPath: "/",
      clean: true,
    },
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: { loader: "swc-loader" },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(woff2?|ttf|eot|svg|png|jpe?g|gif)$/,
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        favicon: "./public/favicon.ico",
      }),
    ],
    devServer: {
      host: "localhost",
      port: 2000,
      open: false,
      historyApiFallback: true,
      hot: true,
      proxy: [
        {
          context: ["/graphql"],
          target: "http://localhost:2002",
        },
        {
          context: ["/api"],
          target: "http://localhost:2002",
          ws: true,
        },
      ],
      client: {
        overlay: { errors: true, warnings: false },
      },
    },
    performance: { hints: false },
  };
};
