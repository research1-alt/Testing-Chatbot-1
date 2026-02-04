
import { GoogleGenAI, Type, Modality } from "@google/genai";

interface GeminiResponse {
    answer: string;
    suggestions: string[];
    isUnclear: boolean;
}

const languageMap: { [key: string]: string } = {
    'en-US': 'English',
    'hi-IN': 'Hindi (हिन्दी)',
    'mr-IN': 'Marathi (मराठी)',
    'ta-IN': 'Tamil (தமிழ்)',
    'te-IN': 'Telugu (తెలుగు)',
    'bn-IN': 'Bengali (বাংলা)',
    'gu-IN': 'Gujarati (ગુજરાતી)',
    'kn-IN': 'Kannada (कನ್ನಡ)',
    'ml-IN': 'Malayalam (മലയാളം)',
    'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
    'ur-IN': 'Urdu (اردو)',
    'as-IN': 'Assamese (অসমীয়া)',
    'or-IN': 'Odia (ଓਡੀਆ)',
};

export async function getChatbotResponse(
    query: string, 
    context: string | null,
    chatHistory: string,
    language: string,
): Promise<{ answer: string, suggestions: string[], isUnclear: boolean }> {
  const apiKey = process.env.API_KEY;
  const targetLanguageFull = languageMap[language] || 'English';
  
  if (!apiKey || apiKey === "") {
      return {
          answer: "⚠️ SYSTEM CONFIGURATION ERROR: The 'API_KEY' is missing in environment variables.",
          suggestions: ["Contact Admin"],
          isUnclear: true
      };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `YOU ARE "OSM MASTER MENTOR"—THE AUTHORITATIVE SERVICE INTELLIGENCE FOR OMEGA SEIKI MOBILITY.

### CORE OPERATIONAL DIRECTIVE:
You MUST respond EXCLUSIVELY in the NATIVE SCRIPT of the selected language: ${targetLanguageFull}. 
- DO NOT use Romanized Hindi/Transliteration.
- Translate explanations and safety warnings into the native script.

### STANDARD HANDLING LOGIC FOR COMMON COMPONENTS (MANDATORY):
Rule 1: Identify Component/System Overlap
If a component (e.g., "MCU Relay", "Converter") exists in more than one Powertrain or Battery Pack (e.g., "Matel" and "Virya"):
Rule 2: Ask Clarification Before Answering
DO NOT provide technical details immediately. Use this exact format:
"[COMPONENT NAME] is available in multiple systems. Please confirm which system you want information about:
1. [System 1 Name]
2. [System 2 Name]"
Add these system names to the "suggestions" array.

### DIAGRAM DISPLAY RULE:
The "Diagram Link" (Column 5) in the database is CRITICAL.
- If a matching row contains a URL in the "Diagram Link" column, you MUST embed it in the "answer" field using Markdown: ![Diagram](URL).
- ALWAYS place the diagram immediately after the [STEP] or [PIN] it refers to, or at the end of the procedure.

### TAG PRESERVATION:
Keep these tags in English: [STEP 1], [STEP 2], [PIN 30], [PIN 87a], MCU, KSI, CAN, GND, BAT, V, A, Ohm.

### SPREADSHEET COLUMN MAPPING:
1. Topic / Component | 2. Category | 3. Technical Specs | 4. Procedure / Pin-out | 5. Diagram Link

### OUTPUT JSON SCHEMA:
- "answer": Markdown response in NATIVE SCRIPT of ${targetLanguageFull}. Embed diagrams using ![]().
- "suggestions": 3 context-aware buttons.
- "isUnclear": True if clarification is needed (Rule 2).`;

    const fullPrompt = `### MASTER DATABASE:
${context?.split('[ADMIN UPLOADED MANUALS]')[0] || "DATABASE SYNC ERROR."}

### MANUALS:
${context?.split('[ADMIN UPLOADED MANUALS]')[1] || "NO SUPPLEMENTAL FILES."}

### CHAT HISTORY:
${chatHistory}

### TECHNICIAN QUERY:
"${query}"

### FINAL COMMAND:
If multi-system match exists, follow Rule 2. If single match, provide technical solution with DIAGRAMS from Column 5 embedded as Markdown images. Use NATIVE SCRIPT for ${targetLanguageFull}. Output JSON.`;
  
    const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
            systemInstruction,
            temperature: 0.1, 
            thinkingConfig: { thinkingBudget: 16384 },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answer: { type: Type.STRING },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    isUnclear: { type: Type.BOOLEAN }
                },
                required: ["answer", "suggestions", "isUnclear"]
            }
        },
    });

    const responseText = result.text || "";
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}') + 1;
    
    return JSON.parse(responseText.substring(startIdx, endIdx)) as GeminiResponse;

  } catch (error: any) {
    console.error("OSM AI Failure:", error);
    return {
        answer: "Technical Intelligence Link Severed. Please check language settings.",
        suggestions: ["Reconnect System"],
        isUnclear: true
    };
  }
}

export async function generateSpeech(text: string, language: string): Promise<string> {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return '';
        const ai = new GoogleGenAI({ apiKey });
        const targetLanguageName = languageMap[language] || 'English';

        const cleanText = text
            .replace(/SAFETY WARNING:/g, 'Warning.')
            .replace(/!\[.*?\]\(.*?\)/g, 'Refer to schematic.') 
            .replace(/(https?:\/\/[^\s\n)]+)/g, '')
            .replace(/\[STEP \d+\]/g, 'Step.')
            .replace(/\[PIN ([a-zA-Z0-9]+)\]/g, 'Pin $1.')
            .replace(/[*#_~`>]/g, '')
            .replace(/\|/g, ' ') 
            .trim();

        if (!cleanText) return '';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: `Read in ${targetLanguageName}: ${cleanText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { 
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || '';
    } catch (error) {
        return '';
    }
}
