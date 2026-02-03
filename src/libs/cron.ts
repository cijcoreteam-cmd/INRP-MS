import { deleteOldArticlesService } from "../services/article.service";
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


export const deleteArticleCron = () => {

  cron.schedule("0 1 * * *", async () => {
    try {
      console.log("Running article delete cron...");

      const result = await deleteOldArticlesService();

      console.log(result);

    } catch (error) {
      console.error("Cron delete error:", error);
    }
  });

};