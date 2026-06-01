import mongoose from "mongoose";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { SEED_SALONS } from "../lib/seed-data";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim();
    }
  }
}

loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const Salon = mongoose.model(
    "Salon",
    new mongoose.Schema({}, { strict: false })
  );

  const existing = await Salon.countDocuments();
  if (existing >= 10) {
    console.log(`Already seeded (${existing} salons). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  await Salon.deleteMany({});
  await Salon.insertMany(SEED_SALONS);
  console.log(`Seeded ${SEED_SALONS.length} premium Bangalore salons.`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
