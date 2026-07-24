/**
 * Seed employee passwords.
 * Sets a default password "agent123" for all existing employees.
 * Run with: bun run scripts/seed-employee-passwords.ts
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/employee-auth";

async function main() {
  const employees = await db.employee.findMany();
  const hash = hashPassword("agent123");

  for (const emp of employees) {
    await db.employee.update({
      where: { id: emp.id },
      data: { passwordHash: hash },
    });
    console.log(`✓ ${emp.email} → password set to "agent123"`);
  }
  console.log(`\nDone. ${employees.length} employees updated.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
