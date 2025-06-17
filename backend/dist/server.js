"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const openai_1 = require("openai");
const pinecone_1 = require("@pinecone-database/pinecone");
(0, dotenv_1.config)();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
const db = firebase_admin_1.default.firestore();
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};
const ContentSchema = zod_1.z.object({
    type: zod_1.z.enum(["document", "tweet", "youtube", "link"]),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    link: zod_1.z.string().url().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return response.data[0].embedding;
}
async function main() {
    const pinecone = new pinecone_1.Pinecone({
        apiKey: process.env.PINECONE_API_KEY
    });
    const index = pinecone.Index("ayushsubconsious");
    async function storeVector(contentId, userId, embedding, metadata) {
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
            const userRecord = await firebase_admin_1.default.auth().createUser({
                email,
                password,
                displayName,
            });
            await db.collection("users").doc(userRecord.uid).set({
                email,
                displayName,
                createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            res.status(201).json({ uid: userRecord.uid });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
    app.post("/auth/signin", async (req, res) => {
        try {
            const { idToken } = req.body;
            const decoded = await firebase_admin_1.default.auth().verifyIdToken(idToken);
            res.json({ uid: decoded.uid });
        }
        catch {
            res.status(401).json({ error: "Invalid token" });
        }
    });
    app.post("/content", verifyToken, async (req, res) => {
        try {
            const data = ContentSchema.parse(req.body);
            const uid = req.user.uid;
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
                createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(payload);
            await storeVector(ref.id, uid, embedding, {
                type: data.type,
                title: data.title,
                tags: data.tags,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: err.errors });
            }
            res.status(500).json({ error: "Failed to create content" });
        }
    });
    app.get("/content", verifyToken, async (req, res) => {
        try {
            const uid = req.user.uid;
            const snap = await db
                .collection("users")
                .doc(uid)
                .collection("contents")
                .get();
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            res.json({ contents: items });
        }
        catch {
            res.status(500).json({ error: "Failed to fetch content" });
        }
    });
    app.post("/search", verifyToken, async (req, res) => {
        try {
            const { q } = req.body;
            const uid = req.user.uid;
            const queryEmbedding = await generateEmbedding(q);
            const result = await index.namespace('ayushsubconsious').query({
                topK: 10,
                vector: queryEmbedding,
                filter: { userId: uid },
                includeMetadata: true,
            });
            res.json({ results: result.matches || [] });
        }
        catch {
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
exports.default = app;
