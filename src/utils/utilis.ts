import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { prisma } from "../libs/prisma";
import { scheduledPostArray } from "../types/types";
import { Prisma } from "@prisma/client";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");

export const schedulePostCron = async () => {
  try {
    const articles = await prisma.article.findMany({
      where: {
        status: "SCHEDULED",
      },
      select: {
        id: true,
        scheduledPosts: true,
      },
    });

    console.log(articles);

    console.log(`Found ${articles.length} scheduled articles`);

    if (articles.length === 0) return;

    const now = dayjs.tz(); // IST current time

    for (const art of articles) {
      const schedules =
        (art.scheduledPosts as unknown as scheduledPostArray[]) ?? [];

      if (schedules.length === 0) continue;

      let updated = false;

      const updatedSchedules = schedules.map((sp) => {
        const scheduleTime = dayjs.tz(
          `${sp.date} ${sp.time}`,
          "YYYY-MM-DD HH:mm",
          "Asia/Kolkata"
        );

        const shouldPost = scheduleTime.isBefore(now);

        if (shouldPost && !sp.isPosted) {
          console.log(
            `✅ Posting article ${art.id} on platform ${
              sp.platform
            } at ${scheduleTime.format()}`
          );
          updated = true;
          return { ...sp, isPosted: true };
        }

        return sp;
      });

      if (!updated) continue;

      const allPosted = updatedSchedules.every((sp) => sp.isPosted);

      const newStatus = allPosted ? "POSTED" : "SCHEDULED";

      await prisma.article.update({
        where: { id: art.id },
        data: {
          scheduledPosts: updatedSchedules as unknown as Prisma.InputJsonValue,
          status: newStatus,
        },
      });
    }
  } catch (err: any) {
    console.error("Cron Error:", err.message);
  }
}

export const   parseS3HttpUrl = (url: string) =>{
  const parsed = new URL(url);

  const hostParts = parsed.hostname.split(".");
  const bucket = hostParts[0];

  const key = parsed.pathname.replace(/^\/+/, "");

  return { bucket, key };
}

