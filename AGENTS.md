
# BASED TRANSLATOR

01. Speech-to-text + translation app using the OpenAI API. No server-side storage - everything stays in user's browser.
02. Users bring their own OpenAI token, and everything stays in the user's browser.
03. It uses npm, plain TypeScript/CSS/html, and Vite.





---





## 1. Project Structure

01. `src/`: the folder contains all project source files.
02. `src/01_webapp/`: the folder that contains the web app source files that form the foundation of based-translator.
03. `src/02_electron/`: the folder that contains the Electron source files that contain the logic for building based-translator as a native app (TODO).





### 1-1. Project Root

01. `.editorconfig`: project coding style.





### 1-2. Web App

01. `src/01_webapp/package.json`: for npm.
02. `src/01_webapp/tsconfig.json`: for TypeScript.
03. `src/01_webapp/vite.config.ts`: for Vite.
04. `src/01_webapp/common`: the folder contains globally-used files.
	04-01. `src/01_webapp/common/scss/app.variable.scss`: global SCSS variables.
05. `src/01_webapp/components`: the folder contains component files.
	05-01. `src/01_webapp/components/typography/typography.component.scss`: text-related components SCSS file.
	05-02. `src/01_webapp/components/button/button.component.scss`: button component SCSS file.
	05-03. `src/01_webapp/components/card/card.component.scss`: card component SCSS file.
	05-04. `src/01_webapp/components/form/form.component.scss`: form component SCSS file.
	05-05. `src/01_webapp/components/tab/tab.component.scss`: tab component SCSS file.
06. `src/01_webapp/dev/dev.html`: dev docs for all components.
	06-01. This page shows atomic component and its HTML code.
07. `src/01_webapp/main.scss`: the main SCSS entry file.
08. `src/01_webapp/main.ts`: the main TypeScript entry file.





### 1-3. Electron

01. TODO: Add a feature where a translated text follows the mouse cursor globally.





---





## 2. UI/UX

01. The below ASCII wireframes are a visual spec as well as a layout guide.
02. Dark theme.
03. Compact design components.





### 2-1. On Startup

```text
+--------------------------------------------+
|  BASED TRANSLATOR                          |
|  - {{SUB_HEADER}}                          |
+--------------------------------------------+
|  [ Recording ]  [ Configuration ]          |
+--------------------------------------------+
|  Recording                                 |
|                                            |
|            [ Start Recording ]             |
|                                            |
|  Status: idle                              |
+--------------------------------------------+
```

01. The main card:
	01-01. Header: `BASED TRANSLATOR`
	01-02. Sub-header: `Speech-to-text + translation app using the OpenAI API.<br>No server-side storage - everything stays in your browser.`
02. There are two tabs - `Recording` and `Configuration`:
	02-01. `Recording` tab: the default view.
	02-02. `Configuration` tab: the config view.
03. One stateful recording button:
	03-01. Idle: `[ Start Recording ]`
	03-02. Recording: `[ Finish Recording ]`
04. Cancel button shown only while recording.
05. Status label:
	05-01. `idle`: Start button visible, Cancel hidden, prompts enabled, status `idle`.
	05-02. `recording`: Finish button visible, Cancel visible, prompts enabled, status `recording`.
	05-03. `transcribing`: Record button disabled, Cancel hidden, prompts disabled, status `transcribing audio...`.
	05-04. `translating`: Record button disabled, Cancel hidden, prompts disabled, status `translating text...`.
	05-05. `success`: Start button visible, prompts enabled, status `done`.
	05-06. `error`: Start button visible, prompts enabled, status shows error message.
	05-07. extra-small font-size.





### 2-2. Recording tab

```text
+--------------------------------------------+
|  BASED TRANSLATOR                          |
|  - {{SUB_HEADER}}                          |
+--------------------------------------------+
|  [ Recording ]  [ Configuration ]          |
+--------------------------------------------+
|  Recording                                 |
|                                            |
|          [ Finish Recording ]  [Cancel]    |
|                                            |
|  Status: recording                         |
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

01. When a user starts recording, show the transcription output box and the translation output box.
	01-01. The transcription output box and the translation output box are not visible on startup.
02. Transcription output box:
	02-01. It shows the result output from `openai.audio.transcriptions.create`.
03. Translation output box:
	03-01. It shows the result output from `openai.responses.create`.





### 2-3. Configuration tab

```text
+--------------------------------------------+
|  BASED TRANSLATOR                          |
|  - {{SUB_HEADER}}                          |
+--------------------------------------------+
|  [ Recording ]  [ Configuration ]          |
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
```

01. OpenAI API key input form.
	01-01. The API key is stored only in `localStorage`.
	01-02. Under the input, show the extra-small label: `Stored only in your browser. Never sent to any server. You’re SAFU!`
02. Transcription prompt textarea.
	02-01. The input is used for `prompt` from `openai.audio.transcriptions.create`.
	02-02. The transcription prompt is stored in `localStorage`.
	02-03. Small font-size.
	02-04. Placeholder: `Use this to help catch tricky words like names, acronyms, brands, or niche terms.`
	02-05. Under the input, show the extra-small label: `Fren, NEET, Based, Cringe, NPC, ...`
03. Translation template textarea.
	03-01. The input is used for `input` from `openai.responses.create`.
	03-02. The translation template is stored in `localStorage`.
	03-03. Small font-size.
	03-04. Placeholder: `Translate {{transcription}} into English.`
	03-05. Under the input, show the extra-small label: `Must include <code class="c-text-inline-code">{{transcription}}</code>`





---





## 3. Logic Flow

```text
function onClickStartRecordingButton() {
	if (microphone not allowed) {
		[Show permission error message]
		[exit]
	}
	else if (OpenAI API key missing) {
		[Show API key error message]
		[exit]
	}
	else if (any possible error occurs) {
		[Show error message]
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





---





## 4. Rules

01. Use simple and easy-to-understand codes.
02. Use single-source-of-truth approach.
03. Great code structure is easy-to-delete.
04. Respect the existing code style.
05. Add useful comments so that other dev frens understand the codes super easy.
06. Add semicolons in the source codes.





---





## 5. Build / Run / Test

01. Build: `$ npm run build`
02. Run: `$ npm run dev`
03. Test: No test needed because this is a simple project.





---





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
