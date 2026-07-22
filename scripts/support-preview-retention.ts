import "dotenv/config";
import { prisma } from "../src/lib/db";
import { applySupportPreviewRetention } from "../src/lib/wepacker/support-preview-retention";

async function main(): Promise<void> {
  if (!process.argv.includes("--execute")) {
    process.stdout.write(
      "Dry run: no database mutation. Pass --execute to apply Support Preview retention.\n",
    );
    return;
  }

  const result = await applySupportPreviewRetention();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Support Preview retention failed (${error instanceof Error ? error.name : "unknown"}).\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
