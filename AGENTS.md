# BASED TRANSLATOR
01. Speech-to-text + translation app using the OpenAI API. No server-side storage - everything stays in user's browser.
02. Users bring their own OpenAI token, and everything stays in the user's browser.
03. It uses pnpm, plain TypeScript/CSS/html, and Vite.



## 1. Project Structure
01. `package.json`: for pnpm.
02. `tsconfig.json`: for TypeScript.
03. `vite.config.ts`: for Vite.
04. `.editorconfig`: project coding style.
05. `src/`: the folder contains all project source files.
06. `src/common`: the folder contains globally-used files.
	06-01. `src/common/scss/app.variable.scss`: global SCSS variables.
07. `src/components`: the folder contains component files.
	07-01. `src/components/typography/typography.component.scss`: text-related components SCSS file.
	07-02. `src/components/button/button.component.scss`: button component SCSS file.
	07-03. `src/components/card/card.component.scss`: card component SCSS file.
	07-04. `src/components/form/form.component.scss`: form component SCSS file.
08. `src/dev/dev.html`: dev docs for all components.
	08-01. This page shows atomic component and its HTML code.
09. `src/main.scss`: the main SCSS entry file.
10. `src/main.ts`: the main TypeScript entry file.



## 2. UI/UX



### 2-1. On Startup

<ui-on-startup>
```text

// The initial view is the same as the recording tab.

```
</ui-on-startup>



### 2-2. Recording tab

<ui-recording-tab>
```text
+--------------------------------------------+
|  BASED TRANSLATOR                          |
|  - Short description                       |
+--------------------------------------------+
|  [ Recording ]  [ Configuration ]          |
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
</ui-recording-tab>



### 2-3. Configuration tab
<ui-configuration-tab>
```text
+--------------------------------------------+
|  BASED TRANSLATOR                          |
|  - Short description                       |
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
</ui-configuration-tab>


01. The ASCII wireframe is a visual spec as well as a layout guide.
	01-01. Implement the wireframe using semantic HTML structure and CSS borders/spacing.
02. There are two tabs: "Recording" and "Configuration".
	02-01. "Recording" tab: the default view.
	02-02. "Configuration" tab: the config view.
03. OpenAI API key input form.
	03-01. The API key is stored only in `localStorage`.
04. Transcription prompt textarea.
	04-01. The input is used for `prompt` from `openai.audio.transcriptions.create`.
	04-02. The transcription prompt is stored in `localStorage`.
	04-03. Small font-size.
05. Translation template textarea.
	05-01. The input is used for `input` from `openai.responses.create`.
	05-02. The translation template is stored in `localStorage`.
	05-03. Small font-size.
06. One stateful recording button:
	06-01. Idle: `[ Start Recording ]`
	06-02. Recording: `[ Finish Recording ]`
07. Cancel button shown only while recording.
08. Status label.
	08-01. `idle`: Start button visible, Cancel hidden, prompts enabled, status `idle`.
	08-02. `recording`: Finish button visible, Cancel visible, prompts enabled, status `recording`.
	08-03. `transcribing`: Record button disabled, Cancel hidden, prompts disabled, status `transcribing audio...`.
	08-04. `translating`: Record button disabled, Cancel hidden, prompts disabled, status `translating text...`.
	08-05. `success`: Start button visible, prompts enabled, status `done`.
	08-06. `error`: Start button visible, prompts enabled, status shows error message.
	08-07. extra-small font-size.
09. Transcription output box.
	09-01. It shows the result output from `openai.audio.transcriptions.create`.
10. Translation output box.
	10-01. It shows the result output from `openai.responses.create`.
11. Dark theme.
12. Compact design components.



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
01. Use simple and easy-to-understand codes.
02. Use single-source-of-truth approach.
03. Great code structure is easy-to-delete.
04. Respect the existing code style.
05. Add useful comments so that other dev frens understand the codes super easy.
06. Add semicolons in the source codes.



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
