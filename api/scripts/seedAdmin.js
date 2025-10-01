require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AdminUser = require("../src/models/AdminUser");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "changeme";
  const existing = await AdminUser.findOne({ username });
  if (existing) {
    console.log("Admin exists");
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 10);
  const u = new AdminUser({ username, passwordHash: hash });
  await u.save();
  console.log("Admin created:", username);
  process.exit(0);
}
seed();
