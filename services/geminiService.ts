
import { GoogleGenAI, Type, Modality } from "@google/genai";

interface GeminiResponse {
    answer: string;
    suggestions: string[];
    isUnclear: boolean;
}

const languageMap: { [key: string]: string } = {
    'en-US': 'English',
    'hi-IN': 'Hindi',
    'mr-IN': 'Marathi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'bn-IN': 'Bengali',
    'gu-IN': 'Gujarati',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
    'pa-IN': 'Punjabi',
    'ur-IN': 'Urdu',
    'as-IN': 'Assamese',
    'or-IN': 'Odia',
};

export async function getChatbotResponse(
    query: string, 
    context: string | null,
    chatHistory: string,
    language: string,
): Promise<{ answer: string, suggestions: string[], isUnclear: boolean }> {
  const apiKey = process.env.API_KEY;
  const targetLanguageName = languageMap[language] || 'English';
  
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

### SPREADSHEET COLUMN MAPPING:
The [MASTER DATABASE] CSV uses these exact headers. You MUST use them to find data:
1. **Topic / Component**: The main subject (e.g., "MCU Relay", "Power Flow").
2. **Category**: The system group (e.g., "Fault Finding", "Startup").
3. **Technical Specs**: Raw data (e.g., "12V", "Type: RB3").
4. **Procedure / Steps / Pin-out**: The instructions.
5. **Diagram Link**: Direct Google Drive URLs for schematics.

### DATA EXTRACTION RULES:
- **PROCEDURES**: Look for text starting with "[STEP 1]", "[STEP 2]". Present these steps clearly using a structured timeline.
- **PIN POSITION**: Look for tags like "[PIN 87a]" or "[PIN 30]". When found, represent them in a Markdown Table or formatted list.
- **SPECIFICATIONS**: Extract data from the "Technical Specs" column for voltages and part types.
- **DIAGRAMS**: If the "Diagram Link" column contains a URL, provide it as a direct link.

### OPERATIONAL DIRECTIVES:
- **IDENTIFY VEHICLE**: If the user asks about "Matel" or "Virya", search the "Topic" or "Procedure" columns for those keywords.
- **DETERMINISM**: Use ONLY the values provided in the spreadsheet. If data is missing, admit it.
- **LANGUAGE**: Respond in ${targetLanguageName.toUpperCase()} but keep technical terms (MCU, KSI, CAN, PIN) in English.

### OUTPUT JSON SCHEMA:
- "answer": Comprehensive Markdown response.
- "suggestions": 3 context-aware technical follow-ups.
- "isUnclear": True only if the spreadsheet has zero relevant data for the query.`;

    const fullPrompt = `### MASTER DATABASE (CONSOLIDATED CSV):
${context?.split('[ADMIN UPLOADED MANUALS]')[0] || "DATABASE SYNC ERROR."}

### SUPPLEMENTAL ADMIN UPLOADS:
${context?.split('[ADMIN UPLOADED MANUALS]')[1] || "NO SUPPLEMENTAL FILES."}

### CHAT LOG:
${chatHistory}

### TECHNICIAN QUERY:
"${query}"

### FINAL ACTION:
Scan the "Topic / Component" and "Procedure / Steps / Pin-out" columns. Use the [STEP X] and [PIN X] tags to structure the response. Filter by powertrain context if detected. Return JSON.`;
  
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
        answer: "Technical Intelligence Link Severed. Verify Sheet 'AI_SYNC' is published to web and API key is active.",
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
            .replace(/!\[.*?\]\(.*?\)/g, 'Refer to technical drawing.') 
            .replace(/(https?:\/\/[^\s\n)]+)/g, '')
            .replace(/\[STEP \d+\]/g, 'Step.')
            .replace(/[*#_~`>]/g, '')
            .replace(/\|/g, ' ') 
            .trim();

        if (!cleanText) return '';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: `Read clearly in ${targetLanguageName}: ${cleanText}` }] }],
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
