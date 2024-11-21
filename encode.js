const fs = require('fs');

let input = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
    input = Buffer.concat([input, chunk]);
});

process.stdin.on('end', () => {
    processInput(input);
});

function processInput(input) {
    const output = [];
    const windowSize = 8192;
    const minMatchLength = 3;
    const maxMatchLength = 264;

    function findLongestMatch(currentPos) {
        let maxLength = 0;
        let maxDistance = 0;
        const searchStart = Math.max(0, currentPos - windowSize);

        for (let i = searchStart; i < currentPos; i++) {
            let length = 0;
            while (currentPos + length < input.length &&
                   input[i + length] === input[currentPos + length] &&
                   length < maxMatchLength) {
                length++;
            }

            if (length >= minMatchLength && length > maxLength) {
                maxLength = length;
                maxDistance = currentPos - i;
            }
        }

        return { length: maxLength, distance: maxDistance };
    }

    let pos = 0;
    while (pos < input.length) {
        const match = findLongestMatch(pos);

        if (match.length >= minMatchLength) {
            let flag = (match.length - 2) << 5;
            let distance = match.distance - 1;

            if (distance < 0x1FFF) {
                flag |= (distance >> 8) & 0x1F;
                output.push(flag);
                output.push(distance & 0xFF);
            } else {
                flag |= 0x1F;
                output.push(flag);
                output.push(0xFF);
                output.push((distance >> 8) & 0xFF);
                output.push(distance & 0xFF);
            }

            if (match.length >= 9) {
                let extraLength = match.length - 9;
                while (extraLength >= 0xFF) {
                    output.push(0xFF);
                    extraLength -= 0xFF;
                }
                output.push(extraLength);
            }

            pos += match.length;
        } else {
            let literalLength = 1;
            while (literalLength < 0x17 && pos + literalLength < input.length) {
                const nextMatch = findLongestMatch(pos + literalLength);
                if (nextMatch.length >= minMatchLength) break;
                literalLength++;
            }

            output.push(literalLength - 1);
            for (let i = 0; i < literalLength; i++) {
                output.push(input[pos + i]);
            }
            pos += literalLength;
        }
    }

    // Ensure the output starts with 0x4C (76 in decimal)
    if (output.length > 0 && output[0] !== 0x4C) {
        output.unshift(0x4C);
    }

    process.stdout.write(Buffer.from(output));
}
