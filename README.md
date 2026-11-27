# Free Adv Twitch Script

An independently maintained continuation of VAFT.

- **Stable 37.0.1** is the default. It reloads the player at the end of an ad. [Stable release](https://github.com/FkManu/free-adv-twitch-script/releases/tag/v37.0.1)
- **Experimental 37.0.4** is for testing on stable connections. It tries to resume playback directly at the end of an ad to reduce the buffering caused by a player reload. [Experimental prerelease](https://github.com/FkManu/free-adv-twitch-script/releases/tag/v37.0.4)

## Install with uBlock Origin

These steps install the stable build.

[Open the uBlock Origin script (Raw)](https://raw.githubusercontent.com/FkManu/free-adv-twitch-script/7f712b22f30ff40c39ede05a3eed263a09e8032d/vaft/vaft-ublock-origin.js)

1. In the uBlock Origin dashboard, open **My filters**, add this rule, and apply changes.

   ```text
   twitch.tv##+js(twitch-videoad)
   ```

2. Under **Settings**, enable **I am an advanced user** and open the gear icon. Set `userResourcesLocation` to the Raw URL below. If you used a previous VAFT URL, including the local test server, replace that URL and keep any unrelated resource URLs.

   ```text
   userResourcesLocation https://raw.githubusercontent.com/FkManu/free-adv-twitch-script/7f712b22f30ff40c39ede05a3eed263a09e8032d/vaft/vaft-ublock-origin.js
   ```

3. Apply changes, disable and re-enable uBlock Origin, then reload Twitch.

## Install with Tampermonkey

[Install the Tampermonkey userscript (Raw)](https://raw.githubusercontent.com/FkManu/free-adv-twitch-script/7f712b22f30ff40c39ede05a3eed263a09e8032d/vaft/vaft.user.js)

Open the link with Tampermonkey installed, confirm installation, and reload Twitch. Keep a single VAFT installation active. If you switch methods or previously installed a test copy, disable that copy first.

## Try the experimental build

- **uBlock Origin**. Follow the steps above with this URL in `userResourcesLocation`. [Experimental uBlock Origin script (Raw)](https://raw.githubusercontent.com/FkManu/free-adv-twitch-script/163b6298c2ea35babe4abbe3ecebdae2abc38908/vaft/vaft-ublock-origin.js)
- **Tampermonkey**. Install the experimental userscript and keep only that VAFT copy active. [Experimental Tampermonkey userscript (Raw)](https://raw.githubusercontent.com/FkManu/free-adv-twitch-script/163b6298c2ea35babe4abbe3ecebdae2abc38908/vaft/vaft.user.js)

The player still reloads when VAFT needs to restore the original master playlist. Playback may still buffer, especially on fluctuating connections. If you see repeated stalls or jumps, use the stable installation link above and reload Twitch. In Tampermonkey, confirm the downgrade if prompted.

## Verify installation

Open the browser console on a Twitch live stream. The `hookWorkerFetch (vaft)` line shows `build=37.0.1` for stable or `build=37.0.4` for experimental. During an ad, look for `Blocking ads` or `Blocking midroll ads` and the selected resolution. In the experimental build, `resume=direct` indicates that VAFT skipped the player reload at the end of the ad. When reporting a problem, include the build, browser, installation method, and relevant VAFT log lines.

The Raw links are pinned to a commit. To update or roll back, switch to the link for the version you want. Contributors can find test and release instructions in the [maintenance notes](vaft/MANUTENZIONE.md).

## Credits and history

The original [pixeltris/TwitchAdSolutions](https://github.com/pixeltris/TwitchAdSolutions) repository was archived on March 5, 2026. Original work by pixeltris and the TwitchAdSolutions contributors is distributed under the [MIT license](LICENSE).

`video-swap-new` and `strip` are retired and kept for historical reference.
