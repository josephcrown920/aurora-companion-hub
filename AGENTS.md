<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Reuse the Creative Studio `MultiTrackTimeline` and `LayersEditor` for music-video editing so manual and Codex-directed cuts share one editor system.
- Use `/canvas` as the single Aurora Canvas: a node-and-connector workspace powered by the existing production workflow engine; redirect legacy `/aurora-canvas` links there to avoid two competing editors.
- Keep `/video-agent/timeline` as the desktop-style agent editor, reusing `MultiTrackTimeline` and `LayersEditor`; effects and presets must operate on that shared timeline so manual and AI edits stay reversible.
- Keep the agent editor's layers and multi-track timeline synchronized; imported local media uses temporary browser URLs and needs reimport after refresh.
- Drive the Video Agent program monitor from the shared timeline document and source offsets, not a separate playlist; this keeps scrub/playback aligned with manual and agent edits.
