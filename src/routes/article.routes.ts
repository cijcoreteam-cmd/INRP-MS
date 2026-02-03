// routes/article.routes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/article.controller";
import { authorize } from "../middleware/authorize";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article management for reporters and editors
 */

/**
 * @swagger
 * /articles/draft:
 *   post:
 *     summary: Save article as draft
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TEXT, AUDIO, VIDEO]
 *               content:
 *                 type: object
 *               audioUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Draft saved successfully
 */
router.post("/draft", authenticate, ctrl.createDraft);

/**
 * @swagger
 * /articles/draft/{id}:
 *   patch:
 *     summary: Update a saved draft
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: object
 *               audioUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft updated successfully
 */
router.patch("/draft/:id", authenticate, ctrl.updateDraft);

/**
 * @swagger
 * /articles/submit:
 *   post:
 *     summary: Submit article for review
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Article submitted successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/submit", authenticate, ctrl.submitArticle);

/**
 * @swagger
 * /articles/article-history:
 *   get:
 *     summary: Get article history
 *     description: Editors can see all articles, Reporters only their own.
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: authorId
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of articles
 */
router.post("/article-history", authenticate, ctrl.getArticleHistory);

/**
 * @swagger
 * /articles/review:
 *   post:
 *     summary: Review or revert article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review completed
 *       401:
 *         description: Unauthorized
 */
router.post("/review", authenticate, ctrl.reviewArticle);

/**
 * @swagger
 * /articles/publish:
 *   post:
 *     summary: Publish article to social media platforms
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               articleId:
 *                 type: string
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [FACEBOOK, TWITTER, LINKEDIN, INSTAGRAM]
 *     responses:
 *       200:
 *         description: Article published successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/publish", authenticate, ctrl.publishArticle);

/**
 * @swagger
 * /articles/stats:
 *   get:
 *     summary: Get article statistics by status
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Article status counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 DRAFT:
 *                   type: integer
 *                 SUBMITTED:
 *                   type: integer
 *                 REVIEWED:
 *                   type: integer
 *                 REVERTED:
 *                   type: integer
 *                 PUBLISHED:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authenticate, ctrl.getStats);

/**
 * @swagger
 * /articles/draft:
 *   get:
 *     summary: Get all drafts created by the authenticated user
 *     description: Returns a paginated list of drafts for the authenticated reporter.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of drafts with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 drafts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [TEXT, AUDIO, VIDEO]
 *                       content:
 *                         type: object
 *                       audioUrl:
 *                         type: string
 *                       videoUrl:
 *                         type: string
 *                       thumbnailUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get("/draft", authenticate, ctrl.getUserDrafts);

/**
 * @swagger
 * /articles/reverted:
 *   get:
 *     summary: Get paginated reverted posts for the authenticated user
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of reverted posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [TEXT, AUDIO, VIDEO]
 *                       content:
 *                         type: object
 *                       remarks:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       editor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/reverted", authenticate, ctrl.getRevertedPosts);

/**
 * @swagger
 * /articles/editor-stats:
 *   get:
 *     summary: Get editor dashboard statistics
 *     tags: [Editor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     todaySubmissions:
 *                       type: integer
 *                       example: 7
 *                     pendingReviews:
 *                       type: integer
 *                       example: 5
 *                     revertedSubmissions:
 *                       type: integer
 *                       example: 1
 *                     approvedToPublish:
 *                       type: integer
 *                       example: 10
 *                     scheduledPosts:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not an editor)
 */

router.get(
  "/editor-stats",
  authenticate,
  authorize(["EDITOR"]),
  ctrl.getEditorStats
);

/**
 * @swagger
 * /articles/reviews:
 *   get:
 *     summary: Get paginated review articles by category
 *     tags: [Editor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: false
 *         description: Category of articles to fetch
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated articles fetched successfully
 *       400:
 *         description: Category is required
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not an editor)
 */
router.get(
  "/reviews",
  authenticate,
  authorize(["EDITOR"]),
  ctrl.getReviewArticles
);

/**
 * @swagger
 * /articles/editor-edit-article/{id}:
 *   patch:
 *     summary: Edit an article as an Editor
 *     description: Allows an Editor to update an article originally created by a Reporter. Only users with the `EDITOR` role can access this endpoint.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the article to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Revised Headline for the Article"
 *               category:
 *                 type: string
 *                 example: "Politics"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["election", "policy"]
 *               content:
 *                 type: object
 *                 description: Updated article body (can be structured JSON)
 *                 example:
 *                   paragraphs:
 *                     - "The editor made some crucial factual updates."
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://cdn.example.com/audio/article123.mp3"
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://cdn.example.com/video/article123.mp4"
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://cdn.example.com/thumbnails/thumb123.jpg"
 *               type:
 *                 type: string
 *                 enum: [TEXT, AUDIO, VIDEO]
 *                 example: "TEXT"
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SUBMITTED, FINAL_CUT, PUBLISHED]
 *                 example: "FINAL_CUT"
 *               remarks:
 *                 type: string
 *                 example: "Corrected factual errors and improved flow."
 *     responses:
 *       200:
 *         description: Article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Bad request (validation or Prisma error)
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Only editors can perform this action
 *       404:
 *         description: Article not found
 */
router.patch(
  "/editor-edit-article/:id",
  authenticate,
  authorize(["EDITOR"]),
  ctrl.editorEditArticle
);

/**
 * @swagger
 * /articles/{articleId}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the article
 *     responses:
 *       200:
 *         description: Article deleted successfully
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Article not found
 */
router.delete("/:articleId", authenticate, ctrl.deleteArticle);

/**
 * @swagger
 * /articles/schedule-post:
 *   post:
 *     summary: Schedule a post across one or more platforms
 *     description: Assign scheduling details for an article including platform, date, and time.
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, scheduledPosts]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Article ID to schedule
 *                 example: "42"
 *               scheduledPosts:
 *                 type: array
 *                 description: Array of platform-wise scheduling details
 *                 items:
 *                   type: object
 *                   required: [platform, date, time, isPosted]
 *                   properties:
 *                     platform:
 *                       type: string
 *                       description: Platform to publish on
 *                       example: "facebook"
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: Scheduled date (YYYY-MM-DD)
 *                       example: "2025-02-10"
 *                     time:
 *                       type: string
 *                       description: Scheduled time (HH:MM format)
 *                       example: "14:00"
 *                     isPosted:
 *                       type: boolean
 *                       description: Whether the post has already been published
 *                       example: false
 *     responses:
 *       200:
 *         description: Post scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Post is scheduled successfully"
 *                     status:
 *                       type: integer
 *                       example: 200
 *       400:
 *         description: Bad request - missing or invalid schedule data
 *       500:
 *         description: Internal server error
 */

router.post("/schedule-post", authenticate, ctrl.schedulePosts);

router.put("/schedule-post", authenticate, ctrl.schedulePosts);

/**
 * @swagger
 * /articles/cancel-scheduled-posts/{id}:
 *   get:
 *     summary: Cancel a scheduled post
 *     description: Cancel a previously scheduled post by its ID
 *     tags: [Scheduling]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the scheduled post to cancel
 *         schema:
 *           type: string
 *           example: "12345"
 *     responses:
 *       200:
 *         description: Post cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Post cancelled successfully"
 *                     status:
 *                       type: integer
 *                       example: 200
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message describing the issue"
 */
router.post(
  "/cancel-scheduled-posts/:id",
  authenticate,
  ctrl.cancelScheduledPost
);

/**
 * @swagger
 * /articles/scheduled-posts:
 *   post:
 *     summary: Get scheduled posts with pagination and filters
 *     description: Retrieve a paginated list of all scheduled posts filtered by article type and category.
 *     tags: [Scheduling]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 description: Page number for pagination (starts from 1)
 *                 minimum: 1
 *                 default: 1
 *                 example: 1
 *               pageSize:
 *                 type: integer
 *                 description: Number of items per page
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 example: 10
 *               articleType:
 *                 type: string
 *                 description: Filter posts by article type
 *                 example: "All"
 *               category:
 *                 type: string
 *                 description: Filter posts by category
 *                 example: "Business"
 *     responses:
 *       200:
 *         description: Scheduled posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: List of scheduled articles
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 123
 *                           title:
 *                             type: string
 *                             example: "AI Trends in 2025"
 *                           scheduledDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-30T09:00:00Z"
 *                           scheduledTime:
 *                             type: string
 *                             example: "09:00 AM"
 *                           scheduledPlatforms:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Twitter", "LinkedIn"]
 *                           status:
 *                             type: string
 *                             enum: [REVIEWED]
 *                             example: "REVIEWED"
 *                           isCancelled:
 *                             type: boolean
 *                             example: false
 *                     status:
 *                       type: integer
 *                       example: 200
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 47
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pageSize:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/scheduled-posts", authenticate, ctrl.getScheduledPosts);
/**
 * @swagger
 * /articles/calendar-events:
 *   get:
 *     summary: Get calendar events for scheduled posts
 *     description: Retrieve all scheduled posts in a format suitable for calendar display
 *     tags: [Calendar]
 *     responses:
 *       200:
 *         description: Calendar events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: List of scheduled posts as calendar events
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 123
 *                       title:
 *                         type: string
 *                         example: "Weekly Product Update"
 *                       scheduledDate:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       scheduledTime:
 *                         type: string
 *                         example: "14:30"
 *                       scheduledPlatforms:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["twitter", "linkedin"]
 *                       audioUrl:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/audio.mp3"
 *                       videoUrl:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/video.mp4"
 *                       thumbnailUrl:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/thumbnail.jpg"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 */
router.get("/calendar-events", authenticate, ctrl.getCalendarData);

/**
 * @swagger
 * /articles/authors:
 *   get:
 *     summary: Get list of authors (reporters)
 *     description: Returns all authors available in the system.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of authors successfully fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Author'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/authors", authenticate, authorize(["EDITOR"]), ctrl.getAuthors);

router.get("/editor-history-stats", authenticate, ctrl.getEditorHistoryStats);

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get an article by ID
 *     description:
 *       Fetch a single article by its ID.
 *       - Reporters can only fetch their own articles.
 *       - Editors/Admins can fetch any article.
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the article
 *     responses:
 *       200:
 *         description: Article fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: REVERTED
 *                 remarks:
 *                   type: string
 *                 audioUrl:
 *                   type: string
 *                 videoUrl:
 *                   type: string
 *                 thumbnailUrl:
 *                   type: string
 *                 category:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 reporter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                 editor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Reporters can only view their own articles
 *       404:
 *         description: Article not found
 */
router.get("/:id", authenticate, ctrl.getArticle);

export default router;
