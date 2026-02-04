
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
The [MASTER DATABASE] CSV uses these headers:
1. **Topic / Component**: The main subject (e.g., "MCU Relay").
2. **Category**: The system group (e.g., "Fault Finding", "Startup").
3. **Technical Specs**: Raw data (e.g., "12V").
4. **Procedure / Steps / Pin-out**: Technical instructions.
5. **Diagram Link**: Schematic URLs.

### STANDARD HANDLING LOGIC (MULTIPLE SYSTEMS):
If a component exists in more than one Powertrain or Battery Pack (e.g., "MCU Relay" in both "Matel MCU" and "Virya Gen 2"):
1. **DETECT MATCHES**: Identify all systems containing this component.
2. **ASK CLARIFICATION**: Do NOT provide technical details immediately.
3. **FORMAT**: Use this exact response format:
   "[Component Name] is available in multiple systems. Please confirm which system you want information about:"
4. **SUGGESTIONS**: List the matching systems as buttons in the "suggestions" array.
5. **PROVIDE DATA**: Only after the user selects a system, provide Specification, Operation, Wiring, and Troubleshooting data.

### DATA EXTRACTION RULES:
- **PROCEDURES**: Look for "[STEP 1]", "[STEP 2]". Present them clearly.
- **PIN POSITION**: Look for "[PIN 87a]" or "[PIN 30]". Represent them as high-visibility labels.
- **SPECIFICATIONS**: Extract from "Technical Specs" column.
- **DIAGRAMS**: If "Diagram Link" contains a URL, provide it.

### OPERATIONAL DIRECTIVES:
- **DETERMINISM**: Use ONLY spreadsheet values. If missing, say so.
- **LANGUAGE ENFORCEMENT**: You MUST respond entirely and exclusively in ${targetLanguageName.toUpperCase()}. Translate all conversational text, instructions, and diagnostics. Strictly keep only technical labels (MCU, KSI, CAN, PIN, Relay, GND, BAT) in English for technical accuracy.

### OUTPUT JSON SCHEMA:
- "answer": Comprehensive Markdown response in ${targetLanguageName.toUpperCase()}.
- "suggestions": 3 context-aware technical follow-ups or system choices.
- "isUnclear": True if no relevant data found.`;

    const fullPrompt = `### MASTER DATABASE (CONSOLIDATED CSV):
${context?.split('[ADMIN UPLOADED MANUALS]')[0] || "DATABASE SYNC ERROR."}

### SUPPLEMENTAL ADMIN UPLOADS:
${context?.split('[ADMIN UPLOADED MANUALS]')[1] || "NO SUPPLEMENTAL FILES."}

### CHAT LOG:
${chatHistory}

### TECHNICIAN QUERY:
"${query}"

### FINAL ACTION:
Reason through the data. Check for multi-system overlap first. Use [STEP X] and [PIN X] tags for structure. You MUST respond in ${targetLanguageName}. Output JSON.`;
  
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
        answer: "Technical Intelligence Link Severed. Verify Sheet 'AI_SYNC' is published to web.",
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
