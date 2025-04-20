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

// Static mock user profiles
const getUserProfile = (section) => {
  switch (section) {
    case 'appearance':
      return {
        skinColor: 'medium brown',
        skinTone: 'warm',
        skinType: 'dry',
        hairType: 'curly',
        goal: 'reduce acne and brighten complexion',
      };
    case 'exercise':
      return {
        height: '175 cm',
        weight: '70 kg',
        fitnessGoal: 'build muscle and improve endurance',
        activityLevel: 'moderate',
      };
    case 'food':
      return {
        dietType: 'vegetarian',
        allergies: 'none',
        calorieGoal: '2200 kcal/day',
        goal: 'balanced nutrition for active lifestyle',
      };
    default:
      return {};
  }
};

// Section-specific system prompt builder
const getSystemPrompt = (section, profile) => {
  switch (section) {
    case 'appearance':
      return `You are a certified dermatologist and beauty advisor.
The user has the following appearance profile:
- Skin Color: ${profile.skinColor}
- Skin Tone: ${profile.skinTone}
- Skin Type: ${profile.skinType}
- Hair Type: ${profile.hairType}
- Appearance Goal: ${profile.goal}

Provide professional, in-depth advice related to skincare, haircare, and beauty routines.`;
    case 'exercise':
      return `You are a certified personal fitness coach.
The user's exercise profile is:
- Height: ${profile.height}
- Weight: ${profile.weight}
- Fitness Goal: ${profile.fitnessGoal}
- Activity Level: ${profile.activityLevel}

Give scientifically-backed, structured workout plans and tips tailored to the user’s fitness profile.`;
    case 'food':
      return `You are a certified nutritionist.
The user's food profile:
- Diet Type: ${profile.dietType}
- Allergies: ${profile.allergies}
- Calorie Goal: ${profile.calorieGoal}
- Nutrition Goal: ${profile.goal}

Provide professional, customized meal plans and food suggestions to help meet the user’s dietary goals.`;
    default:
      return `You are a helpful assistant.`;
  }
};

app.post('/api/chat', async (req, res) => {
  const { message, section } = req.body;

  if (!message || !section) {
    return res.status(400).json({ error: 'Missing message or section.' });
  }

  const profile = getUserProfile(section);
  const systemPrompt = getSystemPrompt(section, profile);

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
