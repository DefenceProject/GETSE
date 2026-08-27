const axios = require('axios');

// Local rules-based writing analysis engine (fallback when no Gemini key is provided)
const localAnalyzeText = (text, action) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  if (wordCount === 0) {
    return {
      feedback: "Please enter some text so the AI assistant can analyze it.",
      suggestions: []
    };
  }

  // Basic sentence count by looking for periods, question marks, exclamation marks
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = Math.round(wordCount / sentenceCount);

  if (action === 'style') {
    let feedback = `Your text has ${wordCount} words and ${sentenceCount} sentences. The average sentence length is ${avgSentenceLength} words.\n\n`;
    const suggestions = [];

    if (avgSentenceLength > 15) {
      feedback += "⚠️ **Readability Alert:** Your sentences are relatively long. Readers may find it easier to follow if you break some of them down into shorter, more punchy statements.";
      suggestions.push("Try breaking down sentences containing conjunctions like 'and', 'but', or 'which'.");
    } else {
      feedback += "✓ **Style Score:** Great sentence length variety! Your writing has a good conversational rhythm.";
    }

    // Check for repetitive words
    const wordFreq = {};
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-zA-Z\u1200-\u137F]/g, '');
      if (clean.length > 3) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    const repetitive = Object.entries(wordFreq)
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1]);

    if (repetitive.length > 0) {
      feedback += `\n\n🔍 **Word Overuse Detected:** You have repeated the following words multiple times: ${repetitive.map(([w, c]) => `**"${w}"** (${c}x)`).join(', ')}.`;
      suggestions.push("Consider using synonyms for your most repeated words to enrich your prose.");
    }

    return { feedback, suggestions };
  }

  if (action === 'vocabulary') {
    const suggestions = [];
    let feedback = "Here are some vocabulary enhancements to elevate your narrative tone:\n\n";

    const synonymsMap = {
      'good': ['excellent', 'marvelous', 'refined', 'formidable'],
      'bad': ['dreadful', 'suboptimal', 'unfavorable', 'adverse'],
      'happy': ['elated', 'joyous', 'exuberant', 'jovial'],
      'sad': ['melancholic', 'despondent', 'lugubrious', 'sorrowful'],
      'very': ['exceptionally', 'profoundly', 'immensely', 'exceedingly'],
      'walk': ['stride', 'amble', 'saunter', 'wander'],
      'say': ['articulate', 'assert', 'declare', 'mutter'],
      'saw': ['observed', 'witnessed', 'gazed upon', 'perceived']
    };

    let count = 0;
    Object.entries(synonymsMap).forEach(([word, syns]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(text)) {
        count++;
        suggestions.push(`Replace **"${word}"** with **"${syns[Math.floor(Math.random() * syns.length)]}"** to sound more expressive.`);
      }
    });

    if (count === 0) {
      feedback += "✓ **Vocabulary Variety:** Your text uses a strong set of words. Keep it up!";
    } else {
      feedback += `We found ${count} common words that can be replaced with more descriptive synonyms. See suggestions below.`;
    }

    return { feedback, suggestions };
  }

  if (action === 'cover') {
    const suggestions = [
      "Use warm gradients (like Gold to Emerald Green) representing the Ethiopian landscape.",
      "Add a central minimalist silhouette reflecting the key character or theme.",
      "Incorporate traditional Ethiopic script (Ge'ez) details in the background textures."
    ];
    let feedback = `**AI Cover Page Design Concept**\n\nBased on your description: *"${text.substring(0, 80)}..."*, here are visual concept directions:\n\n`;
    feedback += `🎨 **Color Palette:** Rich Crimson (#9A0F0F), Warm Amber (#D4AF37), and Charcoal Slate (#2B2B2B).\n`;
    feedback += `📐 **Typography:** Bold Noto Sans Ethiopic or Outfit font centered, with clean, modern metadata spacing.\n`;
    feedback += `💡 **Imagery Concept:** A symbolic, stylized icon (like a cracked shield, an open book, or a single glowing star) rather than a busy photograph, creating a premium look.`;

    const encodedText = encodeURIComponent(text.substring(0, 100));
    const images = [
      `https://image.pollinations.ai/prompt/Cinematic%20book%20cover%20design%20for%20${encodedText}%20realistic%20epic%20lighting?width=400&height=600&seed=${Math.floor(Math.random() * 1000)}`,
      `https://image.pollinations.ai/prompt/Minimalist%20abstract%20book%20cover%20design%20for%20${encodedText}%20vector%20clean%20lines?width=400&height=600&seed=${Math.floor(Math.random() * 1000)}`,
      `https://image.pollinations.ai/prompt/Vibrant%20watercolor%20book%20cover%20design%20for%20${encodedText}%20artistic%20expressive?width=400&height=600&seed=${Math.floor(Math.random() * 1000)}`
    ];

    return { feedback, suggestions, images };
  }

  // Default action: general review
  return {
    feedback: `**General Critique Summary**\n\nYour writing is clear and coherent. Word count: ${wordCount}. Sentence count: ${sentenceCount}.\n\n*Readability is optimal for digital consumption.*`,
    suggestions: ["Add more descriptive adjectives.", "Ensure strong verbs drive the action."]
  };
};

// @desc    AI assisted writing critique
// @route   POST /api/ai/writing-assistant
// @access  Private (Author)
const getWritingFeedback = async (req, res, next) => {
  try {
    const { text, action } = req.body; // action: 'style' | 'vocabulary' | 'cover' | 'general'
    
    if (!text) {
      res.status(400);
      throw new Error('Please provide text for analysis');
    }

    // Check for Gemini API key
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        console.log('Sending text to Google Gemini API...');
        
        let promptText = '';
        if (action === 'style') {
          promptText = `Analyze the writing style, readability, and sentence rhythm of the following text (which might be in English or Amharic). Provide a feedback summary and a list of specific styling suggestions:\n\n${text}`;
        } else if (action === 'vocabulary') {
          promptText = `Identify common or weak words in the following text and suggest strong, descriptive synonyms (in English or Amharic). Provide a feedback summary and a list of replacements:\n\n${text}`;
        } else if (action === 'cover') {
          promptText = `Based on the following book summary or text, generate a beautiful book cover design concept (colors, layout, typography, imagery). Provide a descriptive feedback summary and a list of specific design tips:\n\n${text}`;
        } else {
          promptText = `Provide a comprehensive writing critique, highlighting strengths and areas of improvement for the following text:\n\n${text}`;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        
        const response = await axios.post(url, {
          contents: [{ parts: [{ text: promptText }] }]
        });

        const geminiText = response.data.candidates[0].content.parts[0].text;
        
        const result = {
          feedback: geminiText,
          suggestions: ["Generated directly by Google Gemini 2.5 Flash."]
        };

        if (action === 'cover') {
          const encodedText = encodeURIComponent(text.substring(0, 100));
          result.images = [
            `https://image.pollinations.ai/prompt/Cinematic%20book%20cover%20design%20for%20${encodedText}%20realistic%20epic%20lighting?width=400&height=600&seed=${Math.floor(Math.random() * 1000)}`,
            `https://image.pollinations.ai/prompt/Minimalist%20abstract%20book%20cover%20design%20for%20${encodedText}%20vector%20clean%20lines?width=400&height=600&seed=${Math.floor(Math.random() * 1000)}`,
            `https://image.pollinations.ai/prompt/Vibrant%20watercolor%20book%20cover%20design%20for%20${encodedText}%20artistic%20expressive?width=400&height=600&seed=${Math.floor(Math.random() * 1000)}`
          ];
        }
        
        // Return Gemini output parsed nicely
        return res.json(result);
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to local engine:', geminiError.message);
      }
    }

    // Fallback to local analysis
    const result = localAnalyzeText(text, action || 'general');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWritingFeedback
};
