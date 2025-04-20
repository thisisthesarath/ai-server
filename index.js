import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || '',
    'X-Title': process.env.SITE_NAME || '',
  },
});

// Static user profile for Nitheesh
const userProfile = {
  name: 'Nitheesh',
  age: 21,
  height: 150,
  weight: 63,
  role: 'student',
  activityLevel: 'active',
  dietType: 'non-veg',
  email: 'praveen1@gmail.com',
  createdAt: '2025-04-19T21:59:53.660Z',
  updatedAt: '2025-04-20T02:53:47.599Z',
};

// Unified system prompt for both food and exercise
const getSystemPrompt = (section) => {
  if (section !== 'common') {
    return `You are a helpful assistant.`;
  }

  return `You are a certified fitness coach and professional nutritionist.
The user, ${userProfile.name}, is a ${userProfile.age}-year-old ${userProfile.role}.
Here is the user profile:
- Height: ${userProfile.height} cm
- Weight: ${userProfile.weight} kg
- Activity Level: ${userProfile.activityLevel}
- Diet Type: ${userProfile.dietType}

Based on this information, provide a personalized daily fitness routine and a complete non-vegetarian meal plan.
Ensure the advice supports an active lifestyle and aligns with the user's age and goals. Be precise, professional, and helpful.`;
};

app.post('/api/chat', async (req, res) => {
  const { message, section } = req.body;

  if (!message || !section) {
    return res.status(400).json({ error: 'Missing message or section.' });
  }

  const systemPrompt = getSystemPrompt(section);

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 800,
    });

    const aiResponse = completion?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from AI model.' });
    }

    res.json({ response: aiResponse });
  } catch (err) {
    console.error("OpenRouter API error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Something went wrong with the AI API.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
