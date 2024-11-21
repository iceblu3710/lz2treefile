const fs = require('fs');
const { processInput: encode } = require('./encode.js');

function parseArgs() {
    const args = {
        mode: null,
        inputFile: null,
        outputFile: null
    };

    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case '--encode':
            case '-e':
                args.mode = 'encode';
                break;
            case '--decode':
            case '-d':
                args.mode = 'decode';
                break;
            case '-i':
                args.inputFile = process.argv[++i];
                break;
            case '-o':
                args.outputFile = process.argv[++i];
                break;
        }
    }

    return args;
}

function main() {
    const args = parseArgs();

    if (!args.mode || !args.inputFile || !args.outputFile) {
        console.error('Usage: node codec.js (--encode|-e|--decode|-d) -i <input_file> -o <output_file>');
        process.exit(1);
    }

    const input = fs.readFileSync(args.inputFile);
    let output;

    if (args.mode === 'encode') {
        output = processInput(input);
    } else {
        output = decode(input);
    }

    fs.writeFileSync(args.outputFile, output);
    console.log(`${args.mode.charAt(0).toUpperCase() + args.mode.slice(1)}d file saved as ${args.outputFile}`);
}

main();

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

    return Buffer.from(output);
}
