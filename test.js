const fs = require('fs');

let input = '';
process.stdin.on('data', (chunk) => {
    input += chunk.toString();
});

process.stdin.on('end', () => {
    processOutput(input);
});

function processOutput(data) {
    let output = [];
    let escape = 0x16;
    let maxDist = 0x2000;

    const append = (chunk) => {
        for (const byte of chunk) {
            output.push(byte);
        }
    };

    // Example encoding logic (you need to adapt this based on specific requirements)
    let pos = 0;
    while (pos < data.length) {
        let len = escape;
        if (pos + len > data.length) {
            len = data.length - pos;
        }

        let chunk = Buffer.from(data.slice(pos, pos + len), 'utf8');
        append(chunk);

        let flag = (chunk.length - 1) & 0xFF; // Length flag
        output.push(flag);

        pos += len;
    }

    process.stdout.write(Buffer.from(output));
}
