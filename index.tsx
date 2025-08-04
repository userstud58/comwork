/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, Chat} from '@google/genai';
import {marked} from 'marked';

// --- DOM Elements ---
const apiKeyScreen = document.querySelector('#api-key-screen') as HTMLDivElement;
const apiKeyInput = document.querySelector('#api-key-input') as HTMLTextAreaElement;
const saveApiKeyButton = document.querySelector('#save-api-key-button') as HTMLButtonElement;
const apiError = document.querySelector('#api-error') as HTMLDivElement;
const mainContent = document.querySelector('#main-content') as HTMLDivElement;
const userInput = document.querySelector('#input') as HTMLTextAreaElement;
const modelOutput = document.querySelector('#output') as HTMLDivElement;
const slideshow = document.querySelector('#slideshow') as HTMLDivElement;
const status = document.querySelector('#status') as HTMLDivElement;
const error = document.querySelector('#error') as HTMLDivElement;

// --- Globals for AI instances ---
let textChat: Chat | null = null;
let imageChat: Chat | null = null;

const imageStylePrompt = "Photorealistic, cinematic lighting, sharp focus, high detail, 8k resolution, shot on 35mm film, tasteful, artistic.";

// --- Initialization Logic ---
async function initializeGenAI(apiKey: string) {
  try {
    const ai = new GoogleGenAI({apiKey});

    textChat = ai.chats.create({ model: 'gemini-1.5-pro-latest' });
    imageChat = ai.chats.create({ model: 'gemini-2.0-flash-preview-image-generation' });

    if (!textChat || !imageChat) {
      throw new Error("Failed to create chat models.");
    }

    localStorage.setItem('gemini_api_key', apiKey);
    apiKeyScreen.setAttribute('hidden', 'true');
    mainContent.removeAttribute('hidden');
    userInput.focus();
  } catch (e: any) {
    console.error("API Initialization Failed:", e);
    apiError.textContent = `Initialization failed. Please check your API key. Error: ${e.message}`;
    apiError.removeAttribute('hidden');
  }
}

// --- UI Helper Functions ---
function setStatus(message: string, show: boolean) {
  status.textContent = message;
  status.toggleAttribute('hidden', !show);
}

function setError(message: string, show: boolean) {
    error.innerHTML = message;
    error.toggleAttribute('hidden', !show);
}

async function addSlide(text: string, image: HTMLImageElement) {
  const slide = document.createElement('div');
  slide.className = 'slide';
  const caption = document.createElement('div') as HTMLDivElement;
  caption.innerHTML = await marked.parse(text);
  slide.append(image);
  slide.append(caption);
  slideshow.append(slide);
  slideshow.removeAttribute('hidden');
}

// --- Core Two-Model Logic ---

interface ComicScript {
    characterDescription: string;
    panels: { text: string }[];
}

// STEP 1: Use the text CHAT to create a structured script.
async function generateScript(story: string): Promise<ComicScript | null> {
    if (!textChat) return null;

    const scriptwriterPrompt = `
    You are an expert scriptwriter for a graphic novel. Your job is to take a user's story and prepare it for an artist by creating a structured JSON output.
    1.  **Create a Character Description:** Read the story and create a single, highly-detailed description of the main character (ethnicity, age, hair, eyes, build, features). This description MUST be used for every image to ensure consistency.
    2.  **Break Down Story:** Deconstruct the story into short, single-sentence panels for distinct visual moments.
    3.  **JSON Output:** You MUST output ONLY a single, raw JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json. The JSON object must have keys "characterDescription" (string) and "panels" (array of objects with a "text" key).

    USER STORY: "${story}"
    `;

    try {
        // THE FIX IS HERE: We now wrap the prompt in the correct object structure.
        const result = await textChat.sendMessage({
            parts: [{ text: scriptwriterPrompt }]
        });
        
        const jsonText = await result.response.text();
        
        if (!jsonText) throw new Error("Text model returned no response.");

        // Clean up potential markdown formatting from the response
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');
        
        return JSON.parse(cleanedJsonText) as ComicScript;
    } catch(e) {
        console.error("Failed to generate or parse script:", e);
        setError(`<strong>Scriptwriting Failed:</strong> The AI failed to generate a valid story script. This can happen with complex stories. Please try simplifying your prompt. <br><br><em>Error: ${e}</em>`, true);
        return null;
    }
}

// STEP 2: Loop through the script and generate an image for each panel.
async function generate(story: string) {
    if (!textChat || !imageChat || !story.trim()) return;

    userInput.disabled = true;
    modelOutput.innerHTML = '';
    slideshow.innerHTML = '';
    slideshow.setAttribute('hidden', 'true');
    setError('', false);
    setStatus('Writing the script...', true);
    
    const script = await generateScript(story);

    if (!script || !script.panels || script.panels.length === 0) {
        setStatus('', false);
        userInput.disabled = false;
        userInput.focus();
        return;
    }
    
    const userTurn = document.createElement('div') as HTMLDivElement;
    userTurn.innerHTML = await marked.parse(story);
    userTurn.className = 'user-turn';
    modelOutput.append(userTurn);
    userInput.value = '';

    let panelCount = 0;
    for (const panel of script.panels) {
        panelCount++;
        setStatus(`Generating panel ${panelCount} of ${script.panels.length}...`, true);

        const imagePrompt = `${panel.text}\n\n**Character:** ${script.characterDescription}\n\n**Style:** ${imageStylePrompt}`;
        
        try {
            const result = await imageChat.sendMessageStream({ message: imagePrompt });
            let text = '';
            let img: HTMLImageElement | null = null;
            
            for await (const chunk of result) {
                for (const part of chunk.candidates[0].content?.parts ?? []) {
                    if (part.text) { text += part.text; } 
                    else if (part.inlineData) {
                        img = document.createElement('img');
                        img.src = `data:image/png;base64,` + part.inlineData.data;
                    }
                }
            }
            if (img) {
                await addSlide(panel.text, img);
            } else {
                 throw new Error("Image model did not return an image for this panel.");
            }
        } catch(e) {
            console.error(`Failed to generate panel ${panelCount}:`, e);
            setError(`<strong>Panel ${panelCount} Failed:</strong> Could not generate an image for the text: "${panel.text}" <br><br><em>Error: ${e}</em>`, true);
            break; 
        }
    }
    
    setStatus('', false);
    userInput.disabled = false;
    userInput.focus();
}

// --- Event Listeners (No Changes) ---
saveApiKeyButton.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) await initializeGenAI(apiKey);
});
userInput.addEventListener('keydown', async (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    await generate(userInput.value.trim());
  }
});
examples.forEach((li) => li.addEventListener('click', async (e) => {
  const content = (e.currentTarget as HTMLLIElement).textContent;
  if (content) {
    userInput.value = content;
    await generate(content.trim());
  }
}));
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) initializeGenAI(savedKey);
});
