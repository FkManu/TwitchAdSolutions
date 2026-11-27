# Free Adv Twitch Script

An independently maintained continuation of VAFT. The links below install the tested `37.0.1` build.

## Install with uBlock Origin

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

## Verify installation

Open the browser console on a Twitch live stream. `hookWorkerFetch (vaft) build=37.0.1` confirms the playback worker has loaded this build. During an ad, look for `Blocking ads` or `Blocking midroll ads` and the selected resolution. When reporting a problem, include the build, browser, installation method, and relevant VAFT log lines.

The Raw links are pinned to a commit. To update or roll back, switch to the link for the version you want. Contributors can find test and release instructions in the [maintenance notes](vaft/MANUTENZIONE.md).

## Credits and history

The original [pixeltris/TwitchAdSolutions](https://github.com/pixeltris/TwitchAdSolutions) repository was archived on March 5, 2026. Original work by pixeltris and the TwitchAdSolutions contributors is distributed under the [MIT license](LICENSE).

`video-swap-new` and `strip` are retired and kept for historical reference.
