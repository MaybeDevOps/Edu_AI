import { GoogleGenAI } from '@google/genai'

const fallbackInstruction = 'Siz Edu_AI AI o\'qituvchisisiz. Foydalanuvchi uchun qisqa, aniq va Uzbek tilida javob bering.'

function getResponseText(response: unknown): string | undefined {
  if (typeof response !== 'object' || response === null) {
    return undefined
  }

  const record = response as { text?: string }
  return record.text
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('AI xizmati sozlanmagan')
  }

  const ai = new GoogleGenAI({ apiKey })
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: systemInstruction ?? fallbackInstruction,
    },
  })

  return getResponseText(response) ?? 'Javob olinmadi.'
}
