const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.MIRROR_SERVER_PORT
  ? Number.parseInt(process.env.MIRROR_SERVER_PORT)
  : 80;

const router = express.Router();
router.get("/health", function (req, res) {
  const getVersion = (filename) => {
    return fs.existsSync(path.resolve(filename))
      ? fs.readFileSync(path.resolve(filename)).toString("utf-8")
      : " No version defined";
  };
  const proxy_version = getVersion("version");
  const backoffice_version = getVersion("mirror_backoffice_version");
  const template_version = getVersion("mirror_template_version");
  const dashboard_version = getVersion("mirror_dashboard_version");

  res.status(200).send(
    `Proxy server running OK <br>
     Mirror proxy version: ${proxy_version}<br>
     Mirror backoffice version: ${backoffice_version}<br>
     Mirror dashboard version: ${dashboard_version}<br>
     Mirror template version: ${template_version}<br>
    `
  );
});

// template preview proxy
const templatePreviewProxy = createProxyMiddleware({
  changeOrigin: false,
  ws: false,
  target: "http://mirror_template:3000",
  pathRewrite: { [process.env.MIRROR_TEMPLATE_PUBLIC_URL]: "" },
  on: {
    error: (err, req, res) => {
      res.status(500).send();
      console.error("Error requesting Mirror Template Preview");
      console.error(err);
    },
  },
});
router.use(process.env.MIRROR_TEMPLATE_PUBLIC_URL, templatePreviewProxy);

// api proxy
const apiProxy = createProxyMiddleware({
  changeOrigin: false,
  ws: false,
  target: `http://mirror_backoffice:${
    process.env.MIRROR_BACKOFFICE_PORT
      ? Number.parseInt(process.env.MIRROR_BACKOFFICE_PORT)
      : 3003
  }`,
  on: {
    error: (err, req, res) => {
      res.status(500).send();
      console.error("Error requesting Mirror Backoffice");
      console.error(err);
    },
  },
});
router.use("/api", apiProxy);

// socket proxy
const socketProxy = createProxyMiddleware({
  changeOrigin: false,
  ws: true,
  target: `http://mirror_backoffice:${
    process.env.MIRROR_BACKOFFICE_PORT
      ? Number.parseInt(process.env.MIRROR_BACKOFFICE_PORT)
      : 3003
  }`,
  on: {
    error: (err, req, res) => {
      res.status(500).send();
      console.error("Error Socket");
      console.error(err);
    },
  },
});
router.use("/socket.io", socketProxy);

// dashboard proxy
const dashboardProxy = createProxyMiddleware({
  changeOrigin: false,
  ws: false,
  target: "http://mirror_dashboard:3000",
  pathRewrite: { [process.env.MIRROR_DASHBOARD_PUBLIC_URL]: "" },
  on: {
    error: (err, req, res) => {
      res.status(500).send();
      console.error("Error requesting Mirror Dashboard");
      console.error(err);
    },
  },
});
router.use("*", dashboardProxy);

app.use(
  morgan(
    ":remote-addr - :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] :referrer :user-agent"
  )
);
app.use("/", router);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
