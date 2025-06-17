import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import { z } from "zod";
import admin from "firebase-admin";
import { OpenAI } from "openai";
import { Pinecone } from '@pinecone-database/pinecone';

config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const ContentSchema = z.object({
  type: z.enum(["document", "tweet", "youtube", "link"]),
  title: z.string().min(1),
  content: z.string().min(1),
  link: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
  });

  const index = pinecone.Index("ayushsubconsious");

async function storeVector(
  contentId: string,
  userId: string,
  embedding: number[],
  metadata: Record<string, any>
) {
  const record = {
    id: contentId,
    values: embedding,
    metadata: {
      userId: userId,
      ...metadata,
    },
  };

  await index.namespace('example-namespace').upsert([record]);
}



  app.get("/health", (_req, res) => {
    res.json({ status: "OK", ts: new Date().toISOString() });
  });

  app.post("/auth/signup", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });
      await db.collection("users").doc(userRecord.uid).set({
        email,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(201).json({ uid: userRecord.uid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/auth/signin", async (req, res) => {
    try {
      const { idToken } = req.body;
      const decoded = await admin.auth().verifyIdToken(idToken);
      res.json({ uid: decoded.uid });
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.post("/content", verifyToken, async (req, res) => {
    try {
      const data = ContentSchema.parse(req.body);
      const uid = req.user!.uid;
      const embedding = await generateEmbedding(`${data.title} ${data.content}`);
      const ref = db
        .collection("users")
        .doc(uid)
        .collection("contents")
        .doc();
      const payload = {
        ...data,
        id: ref.id,
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await ref.set(payload);
      await storeVector(ref.id, uid, embedding, {
        type: data.type,
        title: data.title,
        tags: data.tags,
      });
      
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors });
      }
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  app.get("/content", verifyToken, async (req, res) => {
    try {
      const uid = req.user!.uid;
      const snap = await db
        .collection("users")
        .doc(uid)
        .collection("contents")
        .get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      res.json({ contents: items });
    } catch {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/search", verifyToken, async (req, res) => {
    try {
      const { q } = req.body;
      const uid = req.user!.uid;
      const queryEmbedding = await generateEmbedding(q);
       const result = await index.namespace('ayushsubconsious').query({
          topK: 10,
          vector: queryEmbedding,
          filter: { userId: uid },
          includeMetadata: true,
        });

      res.json({ results: result.matches || [] });
    } catch {
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default app;
