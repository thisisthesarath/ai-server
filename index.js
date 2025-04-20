import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Unified user profile for food + exercise
const getUserProfile = () => {
  return {
    name: 'Nitheesh',
    age: 21,
    height: '150 cm',
    weight: '63 kg',
    role: 'student',
    activityLevel: 'active',
    dietType: 'non-veg',
    email: 'praveen1@gmail.com',
  };
};

// Unified system prompt for food and exercise
const getSystemPrompt = (profile) => {
  return `You are a certified fitness coach and nutritionist. Provide personalized, evidence-based guidance on workouts, nutrition, and wellness.
The user's profile is:
- Name: ${profile.name}
- Age: ${profile.age}
- Height: ${profile.height}
- Weight: ${profile.weight}
- Role: ${profile.role}
- Activity Level: ${profile.activityLevel}
- Diet Type: ${profile.dietType}
- Email: ${profile.email}

Always tailor your answers based on the user's body profile, lifestyle, and goals.`;
};

app.post('/api/chat', async (req, res) => {
  const { message, section } = req.body;

  if (!message || !section || section !== 'common') {
    return res.status(400).json({ error: 'Missing message or invalid section.' });
  }

  const profile = getUserProfile();
  const systemPrompt = getSystemPrompt(profile);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || '',
        'X-Title': process.env.SITE_NAME || '',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('⚠️ AI API response missing message:', data);
      return res.status(500).json({ error: 'AI model did not return a message.' });
    }

    res.json({ response: aiResponse });
  } catch (err) {
    console.error('🔥 OpenRouter API error:', err.message || err);
    res.status(500).json({
      error: 'Something went wrong with the AI API.',
      details: err.message || 'Unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
