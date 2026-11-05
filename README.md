# BELONG — Three chapters and video reflection

Run `node serve.mjs`, then open http://127.0.0.1:4173/. No frameworks or installation are required.

The three chapter videos retain their independent watched progress and sequential unlocking. After all three are watched in full, Continue to role play returns to the homepage. The existing homepage artwork then becomes a darkened, keyboard-accessible Role play entry.

Start practice opens assets/role.mp4. First viewing blocks forward seeking and speed changes. Site navigation stays unavailable until this video finishes; closing or refreshing the browser retains watched progress. The reflection textbox appears only after the real video ending. Non-empty reflections can be submitted once. Successful submission is displayed beside the button for about 1.6 seconds, followed by the homepage completion message.

Progress, drafts and the submitted reflection are stored locally in the current browser under belong-learning-v5. No server upload or Qualtrics submission interface is configured. Earlier chapter progress migrates from belong-learning-v4 or belong-learning-v3. Old conversation completion does not count as completion of the replacement role video and reflection.

The original images, fonts and chapter videos are preserved. Role video source: assets/role.mp4, duration read from the media itself. The large Diversity video remains unconverted.

## AI Companion

AI Companion uses deepseek-v4.1-flash through the Qianwen platform. Run node serve.mjs and open http://127.0.0.1:4173/#14:45. It supports streamed replies, new chats, local conversation history, stop and retry, and copying replies. Enter sends; Shift+Enter starts a new line. Deep thinking and paid search tools are disabled by default.

The server prints a private local setup URL when it starts. The setup page checks the model before saving the API key. Credentials are encrypted with Windows DPAPI under the current Windows account in AppData/Local/BELONG, outside the website directory. They are never sent to the browser. Existing configuration loads automatically on restart. A different computer/account requires its own configuration or a server environment variable QIANWEN_API_KEY / DASHSCOPE_API_KEY and optional QIANWEN_BASE_URL.

Chats are stored in the current browser, separately from learning progress. The backend limits input, output and request frequency. It binds to 127.0.0.1 and does not expose backend files, private configuration or arbitrary local files.
