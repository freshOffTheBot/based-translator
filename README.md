
# BASED TRANSLATOR
Speech-to-text translator using the OpenAI API.
No server-side storage - everything stays in your browser.



## Features
- Enter your OpenAI API key in the app.
- Click `Start` to begin recording from your microphone.
- Click `Finish` to transcribe your speech into text.
- Click `Cancel` to stop and discard the current recording.
- Your audio and text stay in your browser (no server-side storage).



## Dev

```bash
# Local developement:
pnpm install
pnpm run dev

# Build:
pnpm run build
```



## Security Note
- API key is stored in `localStorage` in the same browser profile on the same device.
- Use a dedicated key with limited scope/credit when possible.
