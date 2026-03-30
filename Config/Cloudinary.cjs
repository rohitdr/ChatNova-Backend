const cloudinary = require('cloudinary').v2;
cloudinary.config({
 cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
  timeout: 600000
})
module.exports =cloudinary;