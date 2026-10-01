# Aurora Video Studio — implementation checklist

Source: creator-supplied **AI Video Editor Technical Specification** (October 2026). This is a build checklist, not a claim that the referenced products or models are available in Aurora. Implement inside `/video-agent` and its editor; preserve the shared timeline and layers editor. No external test studio.

## Music video creation
- [x] Song upload, performer photo, creative brief, 1–6 generated scenes and in-page previews.
- [x] Narrative, Lyrics Video and Visualizer selections in the builder. **Current limitation:** all three make short AI scenes; Lyrics does not render synchronized text and Visualizer is not yet audio-reactive.
- [x] Hand generated scenes and song to the shared Agent Editor timeline.
- [ ] Tag uploaded audio, performer and other references in the brief with `@` bindings.
- [ ] Analyze actual song beats and drive cuts, effects and sound cues from that analysis (manual BPM is available now).
- [ ] Render timed lyrics and genuine audio-reactive graphics for their respective modes.
- [ ] Save each finished generated scene into the creator's private library with its own video page.
- [ ] Assemble/export a finished music video with the uploaded song; generated scenes currently have no song audio.

## Editor and VFX
- [x] Shared multi-track editor, manual split/trim, layers, undo/redo, effect cards and editable shot plan.
- [x] Preview and scrub imported clips against the audio tracks; left trims and splits retain source offsets. Playback is in-browser, not a rendered final video.
- [ ] Make supported filters (VHS, black-and-white, blur, glitch) affect preview and final rendered export.
- [ ] Implement real background isolation/replacement, pixel-preserving subject swap (SwitchX), relighting and editable image-layer extraction. **Current background-removal and layer/switch cards do not process pixels.**
- [ ] Export rendered video, audio and captions; current CapCut draft/shot list exports are edit descriptions, not MP4s.
- [ ] Noise removal, voiceover, recording, auto-cut, upscale, SRT captions and external drive import.

## Generation, motion and direction
- [x] Existing Generator & Director, Colors preview, ComfyUI apps, lip-sync and motion tools are linked from the Studio.
- [ ] Route every requested model through a verified, supported provider and expose only capabilities actually available; no assumption that named third-party models, 30s/720p output or batches of eight are supported.
- [ ] Reference and output controls validated against each selected model's real limits.
- [ ] Agent-led project templates and voice input in the editor, with approval before AI edits are applied.
- [ ] Motion and lip-sync generation inside the Video Agent using authorized portrait references and an available worker/provider.

## Verification
- [ ] Signed-in end-to-end test inside Aurora Video Agent with The One, the supplied avatar, generated scenes, timeline scrub and playback; generation consumes AI credits.
- [ ] Verify a rendered exported video with effects, background replacement and song audio when those capabilities exist.