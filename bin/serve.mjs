#!/usr/bin/env node

// dev server
import compression from "compression";
import cors from "cors";
import express from "express";
import expressUrlrewrite from "express-urlrewrite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// get details for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create an express application
const app = express();

// define a port
const port = 3000;

// enable CORS
app.use(cors({ origin: `http://localhost:${port}` }));

// enable compression
app.use(compression());

// parse JSON bodies
app.use(express.json());

// rewrite rule to remove index.html
app.use(expressUrlrewrite(/^(.+)\/index\.html$/, "$1/"));

app.use((req, res, next) => {
  // set Cache-Control header for static assets:
  // res.setHeader('Cache-Control', 'max-age=31536000');

  // for dynamic content; this allows caching but checks with the server for updates
  res.setHeader("Cache-Control", "no-cache");

  // remove /src from the request url
  const filePath = path.join(__dirname, path.sep, "..", path.sep, req.url);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      next();
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      fs.access(indexPath, fs.constants.F_OK, (err) => {
        if (!err) {
          res.sendFile(indexPath);
        } else {
          next();
        }
      });
    } else {
      res.sendFile(filePath);
    }
  });
});

// serve static files from the 'src' directory
app.use(
  express.static(path.join(__dirname, path.sep, "..", path.sep), {
    etag: true,
  }),
);

// start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
