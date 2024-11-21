const fs = require('fs');
const { processInput: encode } = require('./encode.js');

let input = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
    input = Buffer.concat([input, chunk]);
});

process.stdin.on('end', () => {
    const mode = process.argv[2];
    if (mode === 'encode') {
        encode(input);
    } else if (mode === 'decode') {
        decode(input);
    } else {
        console.error('Usage: node codec.js [encode|decode]');
        process.exit(1);
    }
});

function decode(input) {
    let output = [];
    let lbLen = 0;
    let lbDist = 0;
    let escape = 0x16;
    let offInput = 0;

    const append = (chunk) => {
        for (const byte of chunk) {
            output.push(byte);
        }
    };

    while (offInput < input.length) {
        if (lbLen) {
            const offOutput = output.length - lbDist;
            let repeat = offOutput + lbLen - output.length;
            if (repeat < 0) repeat = 0;

            const chunk = output.slice(offOutput, offOutput + lbLen - repeat);
            append(chunk);

            if (repeat) {
                const repeatChunk = chunk.slice(chunk.length - lbDist, Math.min(repeat, chunk.length));
                while (repeat > 0) {
                    if (repeat > repeatChunk.length) {
                        append(repeatChunk);
                        repeat -= repeatChunk.length;
                    } else {
                        append(repeatChunk.slice(0, repeat));
                        repeat = 0;
                    }
                }
            }
            lbLen = 0;
        }

        if (escape) {
            let chunk = input.slice(offInput, offInput + escape);
            append(chunk);
            offInput += escape;
            escape = 0;
        }

        const flag = input[offInput++];
        lbLen = flag >> 5;

        if (lbLen) {
            if (lbLen === 7) {
                let next;
                do {
                    next = input[offInput++];
                    lbLen += next;
                } while (next == 0xff);
            }

            lbLen += 2;

            lbDist = (flag & 0x1F) << 8;
            lbDist += 1 + input[offInput++];

            if (lbDist === 0x2000) {
                lbDist += input[offInput++] << 8;
                lbDist += input[offInput++];
            }
        } else {
            escape = flag + 1;
        }
    }

    process.stdout.write(Buffer.from(output));
}
