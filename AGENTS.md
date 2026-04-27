
# BASED TRANSLATOR
01. Speech-to-text + translation app using the OpenAI API. No server-side storage - everything stays in user's browser.
02. Users bring their own OpenAI token, and everything stays in the user's browser.
03. It uses npm, plain TypeScript/CSS/html, and Vite.





---





## 1. Project Architecture & Structure
- This section explains the project architecture and the structure.



### 1-1. Project Architecture - Principle
01. The architecture is heavily inspired by:
	01-01. Domain driven design.
	01-02. Functional programming.
	01-03. Sandboxed architecture.
	01-04. MVVM architecture (i.e., AngularJS).



### 1-2. Common Folders & Files
01. `common/`: (project root) A folder that contains service logic that is used across the entire project.
02. `<domain>/common/`: A folder that contains service logic that is shared only within a specific domain.
03. `<domain>.service.ts`: The file responsible for the business logic of a specific domain, mainly handling APIs.
04. `<domain>.constant.ts`: The file that contains contant variables for a specific domain - values that do not change.
05. The common files only contain business logic related to its specific domain, and does not include any logic from outside that domain (sandboxing).



### 1-3. Component Folders & Files
01. `component/`: (project root) A folder that contains components that are used across the entire project.
02. `<domain>/component/`: A folder that contains components that are shared only within a specific domain.
03. `<domain>.html`: The HTML file for a specific domain.
04. `<domain>.scss`: The style file for a specific domain.
05. `<domain>.model.ts`: The file that contains models used in a specific domain.
06. `<domain>.component.ts`: The controller file responsible for controlling the view of a specific domain.
07. `<domain>.scss` files define styles that are used only within their corresponding `<domain>.html` files.
08. The view is rendered based on the `<domain>.model.ts` files.
	08-01. Just like in functional programming, if the same model is passed into the controller, the output view will always be the same.
09. The controller file manipulates `<domain>.html` file to update the view, and initialize the `<domain>.html` based on the passed-in model.
	09-01. Similar to AngularJS, it can be used in a MVVM-like pattern.



### 1-4. Components In Common Folder (`common/`) vs. Components In Component Folder (`component/`)
01. A folder `common/` can contain a component when the component exists only once on the screen, not multiple times.
	01-01. On the other hand, if a component can exist multiple times on the screen, then the component belongs to a component folder (`component/`).
02. Components in common folder (`common/`) are stateful.
	02-01. A stateful component is consisted with these files: `.component.ts`, `.html`, `.scss` and `.service.ts`.
	02-02. The variables of a stateful component are located in `.service.ts` (stateful variables).
03. Components in component folder (`component/`) are stateless.
	03-01. As the above description, if the input (`.model.ts`) is the same, then the output (`.html`) is always the same.
	03-02. A stateless component does not have `.service.ts`.





---





## 2. Project Folders & Files
- This section explains the project folders and files.



### 2-1. Project Root Folders & Files
01. `.editorconfig`: project coding style.
02. `package.json`: the root package.json that controls sub-projects (the webapp, Electron, ...).
03. `src/`: the folder contains all project source files.
04. `src/01_webapp/`: the folder that contains the web app source files that form the foundation of based-translator.
05. `src/02_electron/`: the folder that contains the Electron source files that contain the logic for building based-translator as a native app.



### 2-2. Web App
01. `src/01_webapp/package.json`: for npm.
02. `src/01_webapp/tsconfig.json`: for TypeScript.
03. `src/01_webapp/vite.config.ts`: for Vite.
04. `src/01_webapp/main.ts`: The webapp entry point file that starts the Home controller.
05. `src/01_webapp/common`: the folder contains globally-used files.
	05-01. `src/01_webapp/common/scss/app.variable.scss`: global SCSS variables.
06. `src/01_webapp/component`: the folder contains component files.
	06-01. `src/01_webapp/component/typography/typography.component.scss`: text-related components SCSS file.
	06-02. `src/01_webapp/component/button/button.component.scss`: button component SCSS file.
	06-03. `src/01_webapp/component/card/card.component.scss`: card component SCSS file.
	06-04. `src/01_webapp/component/form/form.component.scss`: form component SCSS file.
	06-05. `src/01_webapp/component/tab/tab.component.scss`: tab component SCSS file.
	06-06. `src/01_webapp/component/collapse/collapse.component.scss`: collapse component SCSS file.
07. `src/01_webapp/dev/dev.html`: dev docs for all components.
	07-01. This page shows atomic component and its HTML code.
08. `src/01_webapp/dev/dev.ts`: The dev docs entry file that loads the dev page styles.
09. `src/01_webapp/app/`: The folder that contains the based-translator app logic.
	09-01. `app.html`: The main wrapper of the based-translator app.
	09-02. `app.scss`: The based-translator style logic.
	09-03. `app.component.ts`: The main based-translator's controller.
10. `src/01_webapp/app/common/`:
	10-01. `app-state.service.ts`: The logic handling the based-translator app's state.
11. `src/01_webapp/app/component/recording`:
	11-01. `app-recording.html`: The based-translator's Recording section view file.
	11-02. `app-recording.scss`: The based-translator's Recording section style file, only applies for `app-recording.html`.
	11-03. `app-recording.model.ts`: The based-translator's Recording section model file.
	11-04. `app-recording.component.ts`: The controller file responsible for updating the view by manipulating `app-recording.html` based on `app-recording.model.ts`.
12. `src/01_webapp/app/component/config`:
	12-01. `app-config.html`: The based-translator's Configuration section view file.
	12-02. `app-config.scss`: The based-translator's Configuration section style file, only applies for `app-config.html`.
	12-03. `app-config.model.ts`: The based-translator's Configuration section model file.
	12-04. `app-config.component.ts`: The controller file responsible for updating the view by manipulating `app-config.html` based on `app-config.model.ts`.
13. `src/01_webapp/common/localStorage`:
	13-01. `localStorage.constant.ts`: The local storage related constant variables.
	13-02. `localStorage.service.ts`: The local storage logic.
14. `src/01_webapp/common/openai`:
	14-01. `openai.constant.ts`: The OpenAI related constant variables.
	14-02. `openai.service.ts`: The OpenAI API service logic.
15. `src/01_webapp/common/recording-mic`:
	15-01. `recording-mic.service.ts`: Recording audio logic through the browser's microphone (i.e., `MediaRecorder`).
16. `src/01_webapp/common/native-event`:
	16-01. `native-event.constant.ts`: The DOM CustomEvent names used to notify native wrappers.
	16-02. `native-event.model.ts`: The payload models used by the native DOM CustomEvents.
	16-03. `native-event.service.ts`: The logic that dispatches DOM CustomEvents for native wrappers.
17. `src/01_webapp/home`:
	17-01. `home.html`: The HTML file that is served when accessing the root URL (e.g., `localhost:9999`).
	17-02. `home.scss`: The style file used in `home.html`.
	17-03. `home.component.ts`: The controller file that manipulates `home.html`.



### 2-3. Electron
01. `src/02_electron/forge.config.ts`: The Electron Forge config file for packaging and Vite integration.
02. `src/02_electron/vite.main.config.ts`: The Vite config file for the Electron main-process bundle.
03. `src/02_electron/vite.preload.config.ts`: The Vite config file for the Electron preload bundle.
04. `src/02_electron/vite.renderer.config.ts`: The Vite config file for the Electron renderer bundle.
05. `src/02_electron/forge.env.d.ts`: The type declaration file for Electron Forge Vite environment variables.
06. `src/02_electron/src/app/`: The folder that contains the Electron app logic.
	06-01. `app.constant.ts`: The main Electron app related constant variables.
	06-02. `app.helper.ts`: The helper file for the main Electron app.
07. `src/02_electron/src/main.ts`:The main entry point file of the Electron app.
08. `src/02_electron/src/preload.ts`: The main Electron file that runs before the web page is loaded into the browser window.
	08-01. It has access to both DOM APIs and Node.js environment, and is often used to expose privileged APIs to the renderer via the `contextBridge` API.
	08-02. It bridges webapp DOM CustomEvents to Electron IPC.
	08-03. It keeps Electron APIs out of the shared webapp source.
09. `src/02_electron/src/renderer.ts`: The main Electron file that is responsible for displaying graphical content.
10. `src/02_electron/src/index.css`: The main Electron style file.
11. `src/02_electron/src/common/mouseCursorFollower`:
	11-01. `mouseCursorFollower.component.ts`: The controller file responsible for updating the view by manipulating `mouseCursorFollower.html`, using variables in `mouseCursorFollower.service.ts`.
	11-02. `mouseCursorFollower.constant.ts`: The mouse-cursor-follower related constant variables.
	11-03. `mouseCursorFollower.html`: The mouse-cursor-follower view file.
	11-04. `mouseCursorFollower.scss`: The mouse-cursor-follower style file, only applies for `mouseCursorFollower.html`.
	11-05. `mouseCursorFollower.service.ts`: The mouse-cursor-follower service logic.



#### 2-4. Notes For Electron
01. The main Electron files (`src/02_electron/src/main.ts`, `src/02_electron/src/preload.ts`, `src/02_electron/src/renderer.ts` and `src/02_electron/src/index.css`) must contain the basic Electron app logic.
	01-01. If the folder `src/02_electron/src/common` and the folder `src/02_electron/src/component` are removed, the Electron app must be still runnable as vanilla.
02. Since this is Linux environment (no GUI), do not build the app. I will do it by myself.





---





## 3. UI/UX
01. The below ASCII wireframes are a visual spec as well as a layout guide.
02. Dark theme.
03. Compact design components.



### 3-1. On Startup
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



### 3-2. Recording tab
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



### 3-3. Configuration tab
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





## 4. Logic Flow
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





## 5. Rules
01. Use simple and easy-to-understand codes.
02. Use single-source-of-truth approach.
03. Great code structure is easy-to-delete.
04. Respect the existing code style.
05. Add useful comments so that other dev frens understand the codes super easy.
06. Add semicolons in the source codes.





---





## 6. Build / Run / Test
01. Build the web app: `$ npm run webapp:build`
02. Run the web app dev server: `$ npm run webapp:dev`
03. Test: No test needed because this is a simple project.
04. For the Electron app, no build process needed because the current dev environment is Linux.
	04-01. We build the Electron app manually in a Windows environment.





---





## 7. OpenAI APIs
01. The project uses OpenAI's APIs.
02. After transcription succeeds, the project sends another request to OpenAI Responses API to translate text.



### 7-1. Speech-To-Text API
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



### 7-2. Text Generation API (Translation)

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


