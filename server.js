// server.js
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.ASSISTANT_ID;

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const thread = await openai.beta.threads.create({ messages });
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let reply;
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

      if (runStatus.status === "completed") {
        const msgs = await openai.beta.threads.messages.list(thread.id);
        reply = msgs.data[0].content[0].text.value;
        break;
      } else if (runStatus.status === "failed") {
        return res.status(500).json({ error: "Run failed" });
      }

      await new Promise((r) => setTimeout(r, 1000)); // wait 1 sec
    }

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing request" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
