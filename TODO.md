# TODO: Add Speaker Icon to Chat Bubbles for Individual TTS

## Tasks
- [x] Modify `addMessage` function in `frontend/app.js` to add a speaker icon (🔊) to each received message bubble.
- [x] Add click event listener to the speaker icon to read only that specific message aloud using `speechSynthesis`.
- [x] Ensure the icon is only added to received messages (not sent ones).
- [ ] Test the functionality by running the application and verifying TTS works for individual messages.

## Notes
- Use the existing TTS infrastructure but scope it to individual messages.
- Icon should be appended to the message div for received messages.
- On click, create a new `SpeechSynthesisUtterance` with the message text and speak it.
+