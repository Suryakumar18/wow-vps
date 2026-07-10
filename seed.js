// seed.js — Run with: node seed.js
// Creates 1 admin + 2 regular users in MongoDB

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Change these if needed ─────────────────────────────────────────────────────
const MONGODB_URI = "mongodb://localhost:27017/";

const USERS = [
  {
    fullname: "WOW Admin",
    email: "admin@wowlifestyle.online",
    mobilenumber: "9677710045",
    password: "Admin@1234",
    role: "admin",
  },
  {
    fullname: "Rahul Kumar",
    email: "rahul@example.com",
    mobilenumber: "9876543210",
    password: "User@1234",
    role: "user",
  },
  {
    fullname: "Priya Sharma",
    email: "priya@example.com",
    mobilenumber: "9123456780",
    password: "User@1234",
    role: "user",
  },
];
// ──────────────────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  mobilenumber: { type: String, sparse: true, default: null },
  password: String,
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: null },
  role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },
  cart: { type: Array, default: [], select: false },
  createdAt: { type: Date, default: Date.now },
});

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected.\n");

  const User = mongoose.models.User || mongoose.model("User", userSchema);

  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`⚠  Skipped  ${u.role.padEnd(5)} — ${u.email} (already exists)`);
      continue;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(u.password, salt);

    await User.create({ ...u, password: hashedPassword });
    console.log(`✓  Created  ${u.role.padEnd(5)} — ${u.email}  (password: ${u.password})`);
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
