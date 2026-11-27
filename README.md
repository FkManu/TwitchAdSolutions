# VAFT Community

An independently maintained continuation of VAFT from [pixeltris/TwitchAdSolutions](https://github.com/pixeltris/TwitchAdSolutions), archived on March 5, 2026. The original work is by pixeltris and the TwitchAdSolutions contributors. See [LICENSE](LICENSE) for the MIT license and copyright notice.

**Don't combine Twitch specific ad blockers.**

## Install VAFT

Choose a published release on the repository's **Releases** page. Copy the Raw link for the file you need at that release's commit. GitHub's **Raw** button opens the script itself. A branch link can change as commits are added.

| Install with | File at the release commit | Where to use the Raw link |
| --- | --- | --- |
| uBlock Origin | `vaft/vaft-ublock-origin.js` | Set `userResourcesLocation` to the Raw URL and add `twitch.tv##+js(twitch-videoad)` in **My filters**. |
| Tampermonkey | `vaft/vaft.user.js` | Open the Raw URL and confirm installation. Disable any local VAFT test script first. |

To update or roll back, switch to the Raw link for the desired release. For uBlock Origin, replace the previous VAFT URL in `userResourcesLocation`, then restart the extension and reload Twitch. In the console, `hookWorkerFetch (vaft) build=…` identifies the version that reached the player.

For reproduction steps and release checks, see [maintenance notes](vaft/MANUTENZIONE.md).

## Recommendations

Proxies are the most reliable way of avoiding ads ([buffering / downtime info](full-list.md#proxy-issues)).

- `TTV LOL PRO` - [chrome](https://chrome.google.com/webstore/detail/ttv-lol-pro/bpaoeijjlplfjbagceilcgbkcdjbomjd) / [firefox](https://addons.mozilla.org/addon/ttv-lol-pro/) / [code](https://github.com/younesaassila/ttv-lol-pro)

Alternatively:

- `Twitch Turbo` - https://www.twitch.tv/turbo
- `Alternate Player for Twitch.tv` - [chrome](https://chrome.google.com/webstore/detail/alternate-player-for-twit/bhplkbgoehhhddaoolmakpocnenplmhf) / [firefox](https://addons.mozilla.org/en-US/firefox/addon/twitch_5/)
- `Purple AdBlock` - [chrome](https://chrome.google.com/webstore/detail/purple-adblock/lkgcfobnmghhbhgekffaadadhmeoindg) / [firefox](https://addons.mozilla.org/en-US/firefox/addon/purpleadblock/) / [userscript](https://raw.githubusercontent.com/arthurbolsoni/Purple-adblock/refs/heads/main/platform/tampermonkey/dist/purpleadblocker.user.js) / [code](https://github.com/arthurbolsoni/Purple-adblock/)
- `AdGuard Extra` - [chrome](https://chrome.google.com/webstore/detail/adguard-extra-beta/mglpocjcjbekdckiahfhagndealpkpbj) / [firefox](https://github.com/AdguardTeam/AdGuardExtra/#firefox) / [userscript](https://userscripts.adtidy.org/release/adguard-extra/1.0/adguard-extra.user.js)
- `vaft` - see below
- `TTV Ad Mute` - [firefox](https://addons.mozilla.org/en-US/firefox/addon/twitch-tv-ad-mute/) / [code](https://github.com/drj101687/ttv-ad-mute)

[Read this for a full list and descriptions.](full-list.md)

[Also see this list maintained by @zGato.](https://github.com/zGato/ScrewTwitchAds)

## Scripts

**There are better / easier to use methods in the above recommendations.**

- vaft - [userscript source](vaft/vaft.user.js) / [uBlock Origin source](vaft/vaft-ublock-origin.js)
  - Attempts to get a clean stream as fast as it can
  - If it fails to get a clean stream it removes ad segments (no playback until ad-free stream is found)
- video-swap-new - [userscript](https://github.com/pixeltris/TwitchAdSolutions/raw/master/video-swap-new/video-swap-new.user.js) / [ublock](https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/master/video-swap-new/video-swap-new-ublock-origin.js) / [ublock (permalink)](https://raw.githubusercontent.com/pixeltris/TwitchAdSolutions/f8f86706daf90daa534b26bce5b2f01238667d5f/video-swap-new/video-swap-new-ublock-origin.js)
  - Attempts to get a clean stream
  - If it fails to get a clean stream it removes ad segments (no playback until ad-free stream is found)
  - Not recommended, `vaft` is a better script

## Applying a script (uBlock Origin)

- Navigate to the uBlock Origin Dashboard (the extension options)
- Under the `My filters` tab add `twitch.tv##+js(twitch-videoad)`.
- Under **Settings**, enable **I am an advanced user**, then open the cog. Put the Raw link for your chosen release in `userResourcesLocation`. Replace any older VAFT URL and keep other resource URLs separated by spaces.
- To ensure uBlock Origin loads the script I recommend that you disable/enable the uBlock Origin extension (or restart your browser).

To stop using a script remove the filter and make the url `unset`.

*For the sake of security it's recommended to use a permalink when using uBlock Origin (permalinks do not auto update).*

*The scripts __may randomly stop being applied by uBlock Origin__ for unknown reasons ([#200](https://github.com/pixeltris/TwitchAdSolutions/issues/200)). It's recommended to use the userscript versions instead.*

## Applying a script (userscript)

Viewing one of the userscript files should prompt the given script to be added when you have a userscript manager installed.

Userscript managers:

- https://violentmonkey.github.io/
- https://www.tampermonkey.net/
- https://apps.apple.com/us/app/userscripts/id1463298887

*Greasemonkey doesn't work with the scripts.*

## Issues with the scripts

If the script doesn't work or you're experiencing freezing / buffering issues see [issues.md](issues.md)
