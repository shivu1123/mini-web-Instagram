const crypto = require("crypto"); // for genrating name
const multer = require("multer"); // for file uploads

const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/img/upload");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, (err, bytes) => {
      const fn = bytes.toString("hex") + path.extname(file.originalname);
      cb(null, fn);
    });
  },
});

const upload = multer({ storage: storage }); // ites an important part it is middleware work only if it requires in route

module.exports = upload;

