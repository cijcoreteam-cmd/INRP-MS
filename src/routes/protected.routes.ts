import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";


const router = Router();


router.get("/editor/only", authenticate, requireRole("EDITOR"), (req, res) => {
res.json({ ok: true, message: "Editor content" });
});


router.get("/reporter/only", authenticate, requireRole("REPORTER"), (req, res) => {
res.json({ ok: true, message: "Reporter content" });
});


export default router;