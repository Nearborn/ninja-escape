# Uploading this build to Nearborn/ninja-escape

Your repository already has a working GitHub Pages Action. You do **not** need to recreate it.

## Through the GitHub website

1. Extract the supplied `ninja-escape-v1.0.0-web-upload.zip` on your computer.
2. Open the extracted folder itself.
3. In GitHub, open `Nearborn/ninja-escape` → **Code** → **Add file** → **Upload files**.
4. Drag the **contents** of the extracted folder into the upload page (not the outer folder itself).
5. Commit directly to `main`.
6. Open **Actions** and wait for `Deploy game to GitHub Pages` to turn green.
7. Test at `https://nearborn.github.io/ninja-escape/`.

The web-upload package intentionally omits `.github` and `.gitignore`; this avoids the hidden-file problem and leaves your already-working deployment workflow alone.

If the installed PWA initially shows the old starter after a successful deployment, close the installed app and reopen it. The service worker is configured to auto-update. If needed, refresh the browser version once before reopening the installed app.
