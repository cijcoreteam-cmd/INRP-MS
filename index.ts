import express from "express";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get("/", (_req, res) => {
  res.json({
    message: "welcome to News Room",
    status: 200,
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
