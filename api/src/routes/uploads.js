const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3({ region: process.env.S3_REGION });
const BUCKET = process.env.S3_BUCKET;

// return presigned URL to upload a file
router.post("/sign", async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const key = `${uuidv4()}-${filename}`;
    const params = {
      Bucket: BUCKET,
      Key: key,
      Expires: 60 * 5,
      ContentType: contentType,
    };
    const url = await s3.getSignedUrlPromise("putObject", params);
    const publicUrl = `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
    res.json({ uploadUrl: url, publicUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create upload URL" });
  }
});

module.exports = router;
