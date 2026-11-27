# Free Adv Twitch Script

An independently maintained continuation of VAFT, published here as a fork of the original GitHub repository. Development and issue reports are tracked in the [Free Adv Twitch Script repository](https://github.com/FkManu/free-adv-twitch-script).

**37.0.5** is the current build. It tries to resume playback directly at the end of an ad and reloads the player if it needs to restore the original master playlist. [37.0.5 release notes](https://github.com/FkManu/TwitchAdSolutions/releases/tag/v37.0.5)

> **New release.** On unstable connections, playback may stall or switch quality unexpectedly. If you run into problems, [go back to stable 37.0.1](#go-back-to-3701).

<a name="try-the-experimental-build"></a>

## Install with uBlock Origin

[Open the 37.0.5 uBlock Origin script (Raw)](https://raw.githubusercontent.com/FkManu/TwitchAdSolutions/fad42ed1754eea26a03c65a7a1623259127a2b70/vaft/vaft-ublock-origin.js)

1. In the uBlock Origin dashboard, open **My filters**, add this rule, and apply changes.

   ```text
   twitch.tv##+js(twitch-videoad)
   ```

2. Under **Settings**, enable **I am an advanced user** and open the gear icon. Set `userResourcesLocation` to the Raw URL below. If you used a previous VAFT URL, including the local test server, replace that URL and keep any unrelated resource URLs.

   ```text
   userResourcesLocation https://raw.githubusercontent.com/FkManu/TwitchAdSolutions/fad42ed1754eea26a03c65a7a1623259127a2b70/vaft/vaft-ublock-origin.js
   ```

3. Apply changes, disable and re-enable uBlock Origin, then reload Twitch.

## Install with Tampermonkey

[Install the 37.0.5 Tampermonkey userscript (Raw)](https://raw.githubusercontent.com/FkManu/TwitchAdSolutions/fad42ed1754eea26a03c65a7a1623259127a2b70/vaft/vaft.user.js)

Open the link with Tampermonkey installed, confirm installation, and reload Twitch. Keep a single VAFT installation active. If you switch methods or previously installed a test copy, disable that copy first.

## Go back to 37.0.1

The stable build reloads the player at the end of an ad. [37.0.1 release notes](https://github.com/FkManu/TwitchAdSolutions/releases/tag/v37.0.1)

- **uBlock Origin**. Replace the VAFT URL in `userResourcesLocation` with the link below. Apply the change, disable and re-enable uBlock Origin, then reload Twitch. [37.0.1 uBlock Origin script (Raw)](https://raw.githubusercontent.com/FkManu/TwitchAdSolutions/7f712b22f30ff40c39ede05a3eed263a09e8032d/vaft/vaft-ublock-origin.js)
- **Tampermonkey**. Open the link below, confirm the downgrade if prompted, then reload Twitch. [37.0.1 Tampermonkey userscript (Raw)](https://raw.githubusercontent.com/FkManu/TwitchAdSolutions/7f712b22f30ff40c39ede05a3eed263a09e8032d/vaft/vaft.user.js)

## Verify installation

Open the browser console on a Twitch live stream. The `hookWorkerFetch (vaft)` line shows `build=37.0.5` or `build=37.0.1`. During an ad, look for `Blocking ads` or `Blocking midroll ads` and the selected resolution. In 37.0.5, `resume=direct` indicates that VAFT skipped the player reload at the end of the ad. When reporting a problem, include the build, browser, installation method, and relevant VAFT log lines.

The Raw links are pinned to a commit. To update or roll back, switch to the link for the version you want. Contributors can find test and release instructions in the [maintenance notes](vaft/MANUTENZIONE.md).

## Credits and history

The original [pixeltris/TwitchAdSolutions](https://github.com/pixeltris/TwitchAdSolutions) repository was archived on March 5, 2026. Original work by pixeltris and the TwitchAdSolutions contributors is distributed under the [MIT license](LICENSE).

`video-swap-new` and `strip` are retired and kept for historical reference.
