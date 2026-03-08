# BASED TRANSLATOR
01. Speech-to-text + translation app using the OpenAI API. No server-side storage - everything stays in user's browser.
02. Users bring their own OpenAI token, and everything stays in the user's browser.
03. It uses pnpm, plain TypeScript, and Vite.



## 1. Project Structure
01. `package.json`: for pnpm.
02. `tsconfig.json`: for TypeScript.
03. `vite.config.ts`: for Vite.
04. `src/`: project source files.
05. `.editorconfig`: project coding style.



## 2. UI/UX

```text
+--------------------------------------------+
|  BASED TRANSLATOR                          |
|  - Short description                       |
+--------------------------------------------+

+--------------------------------------------+
|  Configuration                             |
|                                            |
|  OpenAI API key:                           |
|  [ sk-...                              ]   |
|                                            |
|  Transcription Prompt:                     |
|  [ Enter prompt for speech-to-text ... ]   |
|  [                                     ]   |
|                                            |
|  Translation Template:                     |
|  [ Translate transcription into ...    ]   |
|  [                                     ]   |
|                                            |
+--------------------------------------------+

+--------------------------------------------+
|  Recording                                 |
|                                            |
|            [ Start Recording ]             |
|                                            |
|  Status: idle                              |
|                                            |
|  Transcription Output:                     |
|  +------------------------------------+    |
|  |                                    |    |
|  |                                    |    |
|  +------------------------------------+    |
|                                            |
|  Translation Output:                       |
|  +------------------------------------+    |
|  |                                    |    |
|  |                                    |    |
|  +------------------------------------+    |
|                                            |
+--------------------------------------------+
```


01. The ASCII wireframe is a visual spec as well as a layout guide.
	01-01. Implement the wireframe using semantic HTML structure and CSS borders/spacing.
02. OpenAI API key input form.
	02-01. The API key is stored only in `localStorage`.
03. Transcription prompt textarea.
	03-01. The input is used for `prompt` from `openai.audio.transcriptions.create`.
	03-02. The transcription prompt is stored in `localStorage`.
	03-03. Small font-size.
04. Translation template textarea.
	04-01. The input is used for `input` from `openai.responses.create`.
	04-02. The translation template is stored in `localStorage`.
	04-03. Small font-size.
05. One stateful recording button:
	05-01. Idle: `[ Start Recording ]`
	05-02. Recording: `[ Finish Recording ]`
06. Cancel button shown only while recording.
07. Status label.
	07-01. `idle`: Start button visible, Cancel hidden, prompts enabled, status `idle`.
	07-02. `recording`: Finish button visible, Cancel visible, prompts enabled, status `recording`.
	07-03. `transcribing`: Record button disabled, Cancel hidden, prompts disabled, status `transcribing audio...`.
	07-04. `translating`: Record button disabled, Cancel hidden, prompts disabled, status `translating text...`.
	07-05. `success`: Start button visible, prompts enabled, status `done`.
	07-06. `error`: Start button visible, prompts enabled, status shows error message.
	07-07. extra-small font-size.
08. Transcription output box.
	08-01. It shows the result output from `openai.audio.transcriptions.create`.
09. Translation output box.
	09-01. It shows the result output from `openai.responses.create`.
10. Dark theme.



## 3. Logic Flow

```text
function onClickStartRecordingButton() {
	if (microphone not allowed) {
		[Show permission error message]
		[exit]
	}

	[Browser starts recording]
	[Hide 'Start Recording' button]
	[Show 'Finish Recording' button]
	[Show 'Cancel' button]

	if (user clicks 'Cancel' button) {
		[Cancel recording and delete audio]
		[exit]
	}
	else if (user Clicks 'Finish Recording' button) {
		[Stop recording]
		[Send audio + transcription prompt textarea to OpenAI speech-to-text API]
	}
	
	if (error occurs) {
		[Show error message]
		[exit]
	}

	[Show transcription result in the transcription output box]
	[Build translation input from the transcription output box + translation template]
	[Send request to OpenAI Responses API]

	if (error occurs) {
		[Show error message]
		[exit]
	}

	[Show translation result in the translation output box]
}
```


01. We want to treat the transcription process and the translation process as a single process.
	01-01. All configuration inputs are disabled during the request is in progress.
02. Combine transcription output text with the translation template before calling Responses API:
	02-01. Format: `Translate {{transcription}} into English.`
	02-02. If `{{transcription}}` is not in the translation template on click 'Start Recording' button, then show the error message.
03. Enable the components AFTER every request is done.



## 4. Rules
01. Let's use simple and easy-to-understand codes.
02. Let's have comments so that other dev frens understand the codes super easy.
03. Use single-source-of-truth approach.
04. Add semicolons in the source codes.



## 5. Build / Run / Test
01. Build: `$ pnpm run build`
02. Run: `$ pnpm run dev`
03. Test: No test needed because this is a simple project.



## 6. OpenAI APIs
01. The project uses OpenAI's APIs.
02. After transcription succeeds, the project sends another request to OpenAI Responses API to translate text.


### 6-1. Speech-To-Text API
01. Example code from the official document:

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

02. The example code uses `.mp3`, but we use in-memory in browser.


### 6-2. Text Generation API (Translation)
01. Example code from the official document:

```js
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.responses.create({
	model: "gpt-5.2",
	input: "..."
});

console.log(response.output_text);
```

02. `input` is built from translation template + transcription.
