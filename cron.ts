import { run } from "./main.ts";

Deno.cron("run scraper", "* * * * *", run);
