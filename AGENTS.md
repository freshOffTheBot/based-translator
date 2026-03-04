
# BASED TRANSLATOR
01. Speech-to-text translator using the OpenAI API. No server-side storage - everything stays in your browser.
02. Users bring their own OpenAI token, and everything stays in the user's browser.
03. It uses pnpm, plain TypeScript, and Vite.



## 1. Project Structure
01. `package.json`: for pnpm.
02. `tsconfig.json`: for TypeScript.
03. `vite.config.ts`: for Vite.
04. `src/`: project source files.
05. `.editorconfig`: project coding style.



## 2. UI/UX
01. OpenAI API key input form.
02. Save API Key button.
03. Start button.
04. Finish button.
05. Cancel button.
06. Prompt text input (optional).
07. Transcription text label.
08. Dark theme and minimal design.
09. Use monospace font.
10. Use ASCII art for UI components design.



## 3. Logic Flow

```mermaid
flowchart TD
	A[User enters optional Prompt text] --> B[User clicks Start button]
	B --> C{Microphone allowed?}

	C -- No --> C1[Show permission error message] --> Z[End]
	C -- Yes --> D[Browser starts recording]

	D --> E{User action}

	E -- Clicks Finish --> F[Stop recording]
	E -- Clicks Cancel --> D1[Cancel recording and delete audio] --> Z

	F --> F1[Build API prompt from Prompt text input]
	F1 --> G[Send audio + optional prompt to OpenAI speech-to-text API]

	G --> H{Internet working?}

	H -- No --> H1[Show network error message] --> Z
	H -- Yes --> I{API success?}

	I -- No --> I1[Show API error message] --> Z
	I -- Timeout --> I2[Show timeout message] --> Z
	I -- Yes --> J[Show text result]

	J --> Z[Done]
```


### 3-1. Implementation Notes
01. Prompt text is optional and persisted in browser localStorage.
02. Prompt localStorage key: `based_translator_prompt`.
03. API key localStorage key: `based_translator_openai_api_key`.
04. API key and prompt inputs are disabled while recording/transcribing.
05. Transcription request timeout is 60 seconds.
06. Request payload always includes `file` and `model`, and includes `prompt` only when non-empty.



## 4. Rules
01. Let's use simple and easy-to-understand codes.
02. Let's have comments so that other dev frens understand the codes super easy.
03. Use single-source-of-truth approach.
04. Add semicolons in the source codes.



## 5. Build / Run / Test
01. Build: `$ pnpm run build`
02. Run: `$ pnpm run dev`
03. Test: No test needed because this is a simple project.



## 6. OpenAI Speech To Text
01. The project uses OpenAI's speech-to-text API.
02. Example code from the official document:

```js
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const transcription = await openai.audio.transcriptions.create({
	file: fs.createReadStream("/path/to/file/speech.mp3"),
	model: "gpt-4o-transcribe",
	response_format: "text",
	prompt:"...",
});

console.log(transcription.text);
```

03. The example code uses `.mp3`, but we use in-memory in browser.
