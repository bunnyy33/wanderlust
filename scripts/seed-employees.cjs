/**
 * Seed employee passwords — standalone Node.js version.
 * No bun required. Run with:
 *   DATABASE_URL="your-neon-connection-string" node scripts/seed-employees.cjs
 */
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || "wl-session-secret-dev";

function hashPassword(password) {
  return crypto.createHmac("sha256", SECRET).update(`pwd:${password}`).digest("hex");
}

async function main() {
  const prisma = new PrismaClient();

  const employees = await prisma.employee.findMany();
  console.log(`Found ${employees.length} employees`);

  const hash = hashPassword("agent123");

  for (const emp of employees) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: { passwordHash: hash },
    });
    console.log(`✓ ${emp.email} → password set to "agent123"`);
  }

  console.log(`\nDone! ${employees.length} employees updated.`);
  console.log("You can now log in with any employee email + password: agent123");
  console.log("Example: sarah@wanderlust.ae / agent123");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
