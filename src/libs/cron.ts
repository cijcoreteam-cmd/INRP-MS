import { schedulePostCron } from "../utils/utilis";
import cron from "node-cron";
export const scheduledPostCron = () => {
  const job = cron.schedule("* * * * *", async () => {
    try {
      await schedulePostCron();
      console.log("✅ Cron job executed successfully");
    } catch (error) {
      console.error("❌ Error running scheduled post:", error);
    }
  });

  return job;
};
