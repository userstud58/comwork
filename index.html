/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, Modality, Chat} from '@google/genai';
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
const error = document.querySelector('#error') as HTMLDivElement;

// --- Globals for AI instances ---
let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const additionalInstructions = `
You are a master storyteller and comic artist. Your task is to take a user's story or prompt and turn it into a photorealistic comic strip.
**CRITICAL INSTRUCTIONS:**
1.  **Character Consistency:** You MUST maintain the appearance of the main character(s) in every single image. Create a clear mental model of the character(s) based on the story and stick to it. If the story doesn't describe them, create a consistent appearance yourself.
2.  **Style:** Generate a photorealistic, cinematic image for each panel. The lighting and color palette should be consistent, as if from a single film. The style should be tasteful and artistic.
3.  **Format:** Break the story down into short, single-sentence panels. For each sentence, first provide the text, then generate the corresponding image.
4.  **Process:** For each moment: a. Output the sentence as text. b. Output a single, corresponding photorealistic image.
5.  **No Commentary:** Do not add any extra text, explanations, or commentary. Just the story text and the images. Begin the comic immediately.
`;

// --- Initialization Logic ---

async function initializeGenAI(apiKey: string) {
  try {
    ai = new GoogleGenAI({apiKey});
    // A quick test to see if the key is valid by listing models
    await ai.models.list(); 

    chat = ai.chats.create({
      model: 'gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
      history: [],
    });

    localStorage.setItem('gemini_api_key', apiKey);
    apiKeyScreen.setAttribute('hidden', 'true');
    mainContent.removeAttribute('hidden');
    userInput.focus();
  } catch (e: any) {
    console.error("API Initialization Failed:", e);
    apiError.textContent = `Initialization failed. Please check your API key and network connection. Error: ${e.message}`;
    apiError.removeAttribute('hidden');
  }
}

// --- Main Application Logic ---

async function addSlide(text: string, image: HTMLImageElement) {
  const slide = document.createElement('div');
  slide.className = 'slide';
  const caption = document.createElement('div') as HTMLDivElement;
  caption.innerHTML = await marked.parse(text);
  slide.append(image);
  slide.append(caption);
  slideshow.append(slide);
}

function parseError(e: any) {
    return e.toString();
}

async function generate(message: string) {
  if (!chat || !message.trim()) return;

  userInput.disabled = true;
  chat.history.length = 0;
  modelOutput.innerHTML = '';
  slideshow.innerHTML = '';
  error.innerHTML = '';
  error.setAttribute('hidden', 'true');

  try {
    const userTurn = document.createElement('div') as HTMLDivElement;
    userTurn.innerHTML = await marked.parse(message);
    userTurn.className = 'user-turn';
    modelOutput.append(userTurn);
    userInput.value = '';

    const result = await chat.sendMessageStream({
      message: message + additionalInstructions,
    });

    let text = '';
    let img: HTMLImageElement | null = null;

    for await (const chunk of result) {
      for (const candidate of chunk.candidates) {
        for (const part of candidate.content.parts ?? []) {
          if (part.text) {
            text += part.text;
          } else if (part.inlineData) {
            img = document.createElement('img');
            img.src = `data:image/png;base64,` + part.inlineData.data;
          }
          if (text && img) {
            await addSlide(text, img);
            slideshow.removeAttribute('hidden');
            text = '';
            img = null;
          }
        }
      }
    }
  } catch (e) {
    console.error('An error occurred during generation:', e);
    const msg = parseError(e);
    error.innerHTML = `Something went wrong: ${msg}`;
    error.removeAttribute('hidden');
  }
  userInput.disabled = false;
  userInput.focus();
}

// --- Event Listeners ---

saveApiKeyButton.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    await initializeGenAI(apiKey);
  } else {
    apiError.textContent = 'Please enter an API key.';
    apiError.removeAttribute('hidden');
  }
});

userInput.addEventListener('keydown', async (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const message = userInput.value.trim();
    await generate(message);
  }
});

examples.forEach((li) =>
  li.addEventListener('click', async (e) => {
    const content = (e.currentTarget as HTMLLIElement).textContent;
    if (content) {
      userInput.value = content;
      await generate(content.trim());
    }
  }),
);

// --- Check for saved key on page load ---
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey; // Pre-fill for user convenience
        initializeGenAI(savedKey);
    }
});
