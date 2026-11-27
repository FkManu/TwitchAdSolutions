const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const resourceHeader = 'twitch-videoad.js text/javascript';
const origin = 'https://media.example.test';
const mediaUrl = `${origin}/variant.m3u8`;
const legacyMasterUrl = `${origin}/api/channel/hls/fixture.m3u8?fixture=1`;
const v2MasterUrl = `${origin}/api/v2/channel/hls/fixture.m3u8?fixture=1`;
const legacyTime = '#EXT-X-TWITCH-INFO:SERVER-TIME="1600.25"';
const avcVariant = `#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=640x360,CODECS="avc1.4d401e"\n${mediaUrl}`;
const unknownCodecVariant = `#EXT-X-STREAM-INF:BANDWIDTH=450000,RESOLUTION=320x180\n${origin}/unknown.m3u8`;
const hevcVariant = `#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=640x360,CODECS="hvc1.1.6.L90.B0"\n${origin}/hevc.m3u8`;
const mediaPlaylist = '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,live\nsegment.ts\n';
const adPlaylist = `${mediaPlaylist}#EXT-X-DATERANGE:ID="stitched-fixture",CLASS="MIDROLL"\n`;

function variant(name, resolution, frameRate, bandwidth = 5000000, codec = 'avc1.4d401e') {
    return { url: `${origin}/${name}.m3u8`, resolution, frameRate, bandwidth, codec };
}

function masterPlaylist(...variants) {
    const entries = variants.map(({ url, resolution, frameRate, bandwidth, codec }) =>
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},FRAME-RATE=${frameRate},CODECS="${codec}"\n${url}\n`
    );
    return `#EXTM3U\n${legacyTime}\n${entries.join('')}`;
}

const live1080 = variant('live-1080', '1920x1080', 60);
const low = variant('low', '640x360', 30);
const best = variant('high', '1920x1080', 60);
const hd = variant('hd', '1280x720', 60);
const alternateHd = variant('alternate-hd', '1280x720', 60, 4500000);
const incompatible = variant('hevc-720', '1280x720', 60, 8000000, 'hvc1.1.6.L90.B0');
const aboveTarget = variant('above-target', '2560x1440', 60);
const aboveFrameRate = variant('above-fps', '1280x720', 120);
const lowFrameRate = variant('low-fps', '1280x720', 30);

function loadWorker(filename, networkFetch) {
    let source = readFileSync(join(__dirname, '..', filename), 'utf8');
    if (filename === 'vaft-ublock-origin.js') {
        const newline = source.indexOf('\n');
        assert.equal(source.slice(0, newline).trimEnd(), resourceHeader);
        source = source.slice(newline + 1);
    }

    const warnings = [];
    const logs = [];
    const logger = { log(message) { logs.push(message); }, warn(message) { warnings.push(message); } };
    const page = {
        console: logger,
        document: {
            location: { hostname: 'www.twitch.tv' },
            readyState: 'loading',
            querySelector() { return null; }
        },
        setTimeout() {},
        addEventListener() {},
        fetch: networkFetch,
        Blob: class {
            constructor(parts) { this.source = parts.join(''); }
        },
        URL: class extends URL {
            static createObjectURL(blob) { return blob.source; }
        },
        Worker: class {
            constructor(source) { this.source = source; }
            addEventListener() {}
        }
    };
    page.window = page;
    runInNewContext(source, page, { filename, timeout: 1000 });

    const worker = {
        URL,
        Response,
        console: logger,
        fetch: networkFetch,
        addEventListener() {},
        XMLHttpRequest: class {
            open(method, url) {
                assert.equal(method, 'GET');
                assert.equal(url, 'blob:https://www.twitch.tv/test-worker');
            }
            overrideMimeType() {}
            send() { this.responseText = ''; }
        }
    };
    worker.self = worker;
    const workerSource = new page.Worker('blob:https://www.twitch.tv/test-worker').source;
    runInNewContext(workerSource, worker, { filename: `${filename}:worker`, timeout: 1000 });
    return { worker, warnings, logs };
}

async function runQualityFixture(filename, { live = live1080, players, reading, chosen, profile, reason = 'matched-quality' }) {
    const requests = [];
    const responses = new Map(reading);
    let time = 10000;
    const { worker, warnings, logs } = loadWorker(filename, async (url) => {
        if (url === legacyMasterUrl) return new Response(masterPlaylist(live));
        if (url === live.url) return new Response(adPlaylist);
        requests.push(url);
        time += 42;
        assert.ok(responses.has(url), `Unexpected request for ${url}`);
        return new Response(responses.get(url));
    });
    worker.Date = { now: () => time };
    worker.postMessage = ({ key }) => assert.equal(key, 'UpdateAdBlockBanner');
    await worker.fetch(legacyMasterUrl);
    const { BackupEncodingsM3U8Cache: cache } = worker.StreamInfos.fixture;
    for (const [player, variants] of Object.entries(players)) {
        cache[player] = masterPlaylist(...variants);
    }

    const result = await worker.fetch(live.url);
    assert.equal(await result.text(), responses.get(chosen.url));
    assert.deepEqual(requests, reading.map(([url]) => url));
    assert.ok(logs.includes(`Blocking midroll ads (${profile}, ${chosen.resolution} @ ${chosen.frameRate} fps) [VAFT] target=${live.resolution} targetFps=${live.frameRate} reason=${reason} profiles=${reading.length} elapsedMs=${42 * reading.length}`));
    assert.deepEqual(warnings, []);
}

for (const filename of ['vaft-ublock-origin.js', 'vaft.user.js']) {
    test(filename, async (t) => {
        await t.test('identifies the same build in the page and the playback worker', () => {
            const userscript = readFileSync(join(__dirname, '..', 'vaft.user.js'), 'utf8');
            const version = userscript.match(/^\/\/ @version[ \t]+(\d+\.\d+\.\d+)\s*$/m)?.[1];
            const { logs } = loadWorker(filename, async () => { throw new Error('unexpected network request'); });
            assert.ok(version);
            assert.ok(logs.includes(`[VAFT] page hooks installed build=${version}`));
            assert.ok(logs.includes(`hookWorkerFetch (vaft) build=${version}`));
        });

        await t.test('reuses a master whose variant URL has a query string', { timeout: 1500 }, async () => {
            const queriedUrl = `${mediaUrl}?fixture=1`;
            const playlist = masterPlaylist({ ...live1080, url: queriedUrl });
            const probes = [];
            const { worker, warnings } = loadWorker(filename, async (url) => {
                if (url === legacyMasterUrl) return new Response(playlist);
                probes.push(url);
                assert.equal(url, queriedUrl);
                return new Response(mediaPlaylist);
            });

            await worker.fetch(legacyMasterUrl);
            const first = worker.StreamInfos.fixture;
            assert.equal(await (await worker.fetch(legacyMasterUrl)).text(), playlist);
            assert.equal(worker.StreamInfos.fixture, first);
            assert.deepEqual(probes, [queriedUrl]);
            assert.deepEqual(warnings, []);
        });

        await t.test('rebuilds the cache when its probe fails without logging request data', { timeout: 1500 }, async () => {
            const outdated = `${mediaUrl}?fixture=old`;
            const replacement = `${mediaUrl}?fixture=new`;
            const staleMaster = masterPlaylist({ ...live1080, url: outdated });
            const freshMaster = masterPlaylist({ ...live1080, url: replacement });
            let currentMaster = staleMaster;
            const { worker, warnings } = loadWorker(filename, async (url) => {
                if (url === legacyMasterUrl) return new Response(currentMaster);
                assert.equal(url, outdated);
                throw new DOMException('private fixture request details', 'AbortError');
            });

            await worker.fetch(legacyMasterUrl);
            const first = worker.StreamInfos.fixture;
            currentMaster = freshMaster;
            assert.equal(await (await worker.fetch(legacyMasterUrl)).text(), freshMaster);
            assert.notEqual(worker.StreamInfos.fixture, first);
            assert.equal(worker.StreamInfosByUrl[replacement], worker.StreamInfos.fixture);
            assert.deepEqual(warnings, ['[VAFT] master cache refresh: error=AbortError']);
        });

        for (const masterUrl of [legacyMasterUrl, v2MasterUrl]) {
            await t.test(`accepts a master playlist without a server time tag (${new URL(masterUrl).pathname})`, { timeout: 1500 }, async () => {
                const playlist = `#EXTM3U\n${avcVariant}\n`;
                const upstream = new Response(playlist);
                const { worker, warnings } = loadWorker(filename, async (url) => {
                    assert.equal(url, masterUrl);
                    return upstream;
                });

                assert.equal(await (await worker.fetch(masterUrl)).text(), playlist);
                assert.equal(worker.StreamInfosByUrl[mediaUrl].ChannelName, 'fixture');
                assert.deepEqual(warnings, []);
            });
        }

        await t.test('preserves a variant with unknown codecs alongside AVC and HEVC', { timeout: 1500 }, async () => {
            const playlist = `#EXTM3U\n${legacyTime}\n${avcVariant}\n${unknownCodecVariant}\n${hevcVariant}\n`;
            const { worker, warnings } = loadWorker(filename, async (url) => {
                assert.equal(url, legacyMasterUrl);
                return new Response(playlist);
            });

            assert.equal(await (await worker.fetch(legacyMasterUrl)).text(), playlist);
            assert.ok(worker.StreamInfos.fixture.ModifiedM3U8.includes(unknownCodecVariant));
            assert.ok(!worker.StreamInfos.fixture.ModifiedM3U8.includes('hvc1.1.6.L90.B0'));
            assert.deepEqual(warnings, []);
        });

        await t.test('can retry a master playlist after a parser error without partial cache entries', { timeout: 1500 }, async () => {
            const validPlaylist = `#EXTM3U\n${legacyTime}\n${avcVariant}\n`;
            const malformedVariant = `#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=640x360,CODECS="unknown\\codec"\n${origin}/malformed.m3u8\n`;
            const original = new Response(validPlaylist + malformedVariant);
            const responses = [original, new Response(validPlaylist)];
            const { worker, warnings } = loadWorker(filename, async (url) => {
                assert.equal(url, legacyMasterUrl);
                assert.ok(responses.length);
                return responses.shift();
            });

            assert.equal(await worker.fetch(legacyMasterUrl), original);
            assert.equal(worker.StreamInfos.fixture, undefined);
            assert.equal(worker.StreamInfosByUrl[mediaUrl], undefined);

            assert.equal(await (await worker.fetch(legacyMasterUrl)).text(), validPlaylist);
            assert.equal(worker.StreamInfosByUrl[mediaUrl].ChannelName, 'fixture');
            assert.deepEqual(warnings, ['[VAFT] original playlist returned: type=master phase=process error=SyntaxError']);
        });

        for (const [url, playlist] of [[legacyMasterUrl, `#EXTM3U\n${legacyTime}\n${avcVariant}\n`], [mediaUrl, mediaPlaylist]]) {
            await t.test(`returns the readable original when inspection fails (${new URL(url).pathname})`, { timeout: 1500 }, async () => {
                const upstream = new Response(playlist);
                upstream.clone = () => ({ text: async () => { throw new Error('synthetic read error'); } });
                const { worker, warnings } = loadWorker(filename, async (input) => {
                    assert.equal(input, url);
                    return upstream;
                });

                const result = await worker.fetch(url);
                assert.equal(result, upstream);
                assert.equal(await result.text(), playlist);
                const type = url === mediaUrl ? 'media' : 'master';
                assert.deepEqual(warnings, [`[VAFT] original playlist returned: type=${type} phase=read error=Error`]);
            });
        }

        await t.test('passes through upstream HTTP errors and transport failures', { timeout: 1500 }, async () => {
            const upstream = new Response('Unavailable', { status: 503 });
            const error = new Error('synthetic transport failure');
            const { worker } = loadWorker(filename, async (url) => {
                if (url === mediaUrl) return upstream;
                assert.equal(url, legacyMasterUrl);
                throw error;
            });

            assert.equal(await worker.fetch(mediaUrl), upstream);
            await assert.rejects(worker.fetch(legacyMasterUrl), (failure) => failure === error);
        });

        await t.test('keeps source quality immediately after a reload', { timeout: 1500 }, async () => {
            await runQualityFixture(filename, {
                players: { embed: [best], popout: [hd], autoplay: [low] },
                reading: [[best.url, mediaPlaylist]],
                chosen: best,
                profile: 'embed'
            });
        });

        await t.test('tries a better profile after finding a clean 360p variant', { timeout: 1500 }, async () => {
            await runQualityFixture(filename, {
                players: { embed: [low], popout: [best], autoplay: [low] },
                reading: [[low.url, mediaPlaylist.replace('segment', 'low')], [best.url, mediaPlaylist]],
                chosen: best,
                profile: 'popout'
            });
        });

        await t.test('treats 59.94 and 60 FPS as the same playback tier', { timeout: 1500 }, async () => {
            await runQualityFixture(filename, {
                live: variant('fractional-fps', '1920x1080', 59.94),
                players: { embed: [best], popout: [hd], autoplay: [low] },
                reading: [[best.url, mediaPlaylist]],
                chosen: best,
                profile: 'embed'
            });
        });

        await t.test('chooses compatible HD within the live resolution and ranks FPS then bandwidth', { timeout: 1500 }, async () => {
            await runQualityFixture(filename, {
                live: variant('live-720', '1280x720', 60),
                players: { embed: [low, aboveTarget, incompatible, aboveFrameRate, lowFrameRate, alternateHd, hd], popout: [low], autoplay: [low] },
                reading: [[hd.url, mediaPlaylist]],
                chosen: hd,
                profile: 'embed'
            });
        });

        await t.test('keeps 360p available when the compatible HD playlists still contain ads', { timeout: 1500 }, async () => {
            await runQualityFixture(filename, {
                players: { embed: [best], popout: [hd], autoplay: [low] },
                reading: [[best.url, adPlaylist], [hd.url, adPlaylist], [low.url, mediaPlaylist]],
                chosen: low,
                profile: 'autoplay',
                reason: 'lower-quality'
            });
        });

        for (const { name, modifiedMaster, forceReload, resume } of [
            { name: 'smooth ad exit with a compatible stream', resume: 'direct' },
            { name: 'ad exit after a codec-driven master replacement', modifiedMaster: true, resume: 'reload reason=modified-master' },
            { name: 'ad exit with an explicit reload override', forceReload: true, resume: 'reload reason=configured-reload' }
        ]) {
            await t.test(name, { timeout: 1500 }, async () => {
                const live = modifiedMaster ? { ...live1080, codec: 'hvc1.1.6.L90.B0' } : live1080;
                const backup = { ...best, codec: live.codec };
                const master = modifiedMaster ? masterPlaylist(live, hd) : masterPlaylist(live);
                const resumedPlaylist = mediaPlaylist.replace('segment.ts', 'live-after-ad.ts');
                let incomingPlaylist = adPlaylist;
                let time = 10000;
                const actions = [];
                const { worker, warnings, logs } = loadWorker(filename, async (url) => {
                    if (url === legacyMasterUrl) return new Response(master);
                    if (url === live.url) return new Response(incomingPlaylist);
                    assert.equal(url, backup.url);
                    return new Response(mediaPlaylist);
                });
                worker.Date = { now: () => time };
                worker.postMessage = ({ key }) => actions.push(key);
                if (forceReload) worker.ReloadPlayerAfterAd = true;

                await worker.fetch(legacyMasterUrl);
                const stream = worker.StreamInfos.fixture;
                stream.BackupEncodingsM3U8Cache.embed = masterPlaylist(backup);
                assert.equal(await (await worker.fetch(live.url)).text(), mediaPlaylist);
                assert.equal(stream.IsUsingModifiedM3U8, Boolean(modifiedMaster));
                assert.deepEqual(actions.filter((key) => key !== 'UpdateAdBlockBanner'), modifiedMaster ? ['ReloadPlayer'] : []);

                actions.length = 0;
                incomingPlaylist = resumedPlaylist;
                time = 11000;
                assert.equal(await (await worker.fetch(live.url)).text(), resumedPlaylist);
                assert.equal(await (await worker.fetch(live.url)).text(), resumedPlaylist);
                assert.deepEqual(actions.filter((key) => key !== 'UpdateAdBlockBanner'), modifiedMaster || forceReload ? ['ReloadPlayer'] : []);
                assert.equal(stream.LastPlayerReload, modifiedMaster || forceReload ? 11000 : 10000);
                assert.equal(stream.IsShowingAd, false);
                assert.equal(stream.IsUsingModifiedM3U8, false);
                assert.equal(await (await worker.fetch(legacyMasterUrl)).text(), master);
                assert.ok(logs.includes(`Finished blocking ads [VAFT] resume=${resume}`));
                assert.deepEqual(warnings, []);
            });
        }
    });
}
