import "dotenv/config";
import { runSessionMediaRetention } from "@/lib/wepacker/session-media/retention";

void runSessionMediaRetention()
  .then((result) => {
    console.info("[session-media:retention] completed", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("[session-media:retention] failed", {
      name: error instanceof Error ? error.name : "Error",
    });
    process.exit(1);
  });
