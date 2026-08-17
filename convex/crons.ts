import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process consented lifecycle emails",
  { minutes: 15 },
  internal.lifecycle.processDue,
  {},
);

crons.daily(
  "recompute member RFM",
  { hourUTC: 1, minuteUTC: 30 },
  internal.rfm.nightly,
  {},
);

// First-party nightly warehouse snapshot. BigQuery export is the next upgrade
// if Convex Professional streaming is enabled later.
crons.daily(
  "snapshot daily commerce stats",
  { hourUTC: 2, minuteUTC: 30 },
  internal.dailyStats.createNightlySnapshot,
  {},
);

export default crons;
