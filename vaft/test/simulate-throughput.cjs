// Synthetic delivery model for complete segments that are already available.
const segmentSeconds = 2;
const initialBufferSeconds = 4;
const segmentCount = 15;
const intervalSeconds = 4;

function simulate(bitrateMbps, throughputMbps) {
    let time = 0;
    let buffer = initialBufferSeconds;
    let stalled = 0;
    for (let segment = 0; segment < segmentCount; segment++) {
        const began = time;
        let remainingMegabits = bitrateMbps * segmentSeconds;
        while (remainingMegabits > 0) {
            const interval = Math.floor(time / intervalSeconds);
            const end = (interval + 1) * intervalSeconds;
            const throughput = throughputMbps[interval % throughputMbps.length];
            const availableMegabits = throughput * (end - time);
            if (availableMegabits >= remainingMegabits) {
                time += remainingMegabits / throughput;
                break;
            }
            remainingMegabits -= availableMegabits;
            time = end;
        }
        const downloadSeconds = time - began;
        stalled += Math.max(0, downloadSeconds - buffer);
        buffer = Math.max(0, buffer - downloadSeconds) + segmentSeconds;
    }
    return Number(stalled.toFixed(2));
}

const profiles = [
    { name: 'steady', throughput: [10] },
    { name: 'variable', throughput: [9, 1.3, 8, 0.9, 3, 7] },
    { name: 'intermittent outage', throughput: [7, 0, 0.7, 7, 3, 1] }
];
console.table(profiles.map(({ name, throughput }) => ({
    profile: name,
    'throughput (Mbps every 4 seconds)': throughput.join(' / '),
    'stall at 5.5 Mbps (s)': simulate(5.5, throughput),
    'stall at 1 Mbps (s)': simulate(1, throughput)
})));
