const fs = require('fs');

let input = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
    input = Buffer.concat([input, chunk]);
});

process.stdin.on('end', () => {
    processInput(input);
});

function processInput(input) {
    let lbLen = 0;
let lbDist = 0;
let escape = 0x16;

let offInput = 0;

let output = new Uint8Array(65536);
output.used = 0;

function append(chunk)
{
	if (output.used + chunk.length > output.length) {
		let n = new Uint8Array(output.length + 65536);
		n.set(output);
		n.used = output.used;
		output = n;
	}
	output.set(chunk, output.used);
	output.used += chunk.length;
}

while (offInput < input.length) {

	if (lbLen) {
		const offOutput = output.used - lbDist;

		// If the length goes past the end of the output data, repeat the last
		// character until the length is reached.
		let repeat = offOutput + lbLen - output.used;
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
			// Max distance value possible, next two bytes are a 16-bit value to add.
			lbDist += input[offInput++] << 8;
			lbDist += input[offInput++];
		}

	} else {
		escape = flag + 1;
	}
}

// Trim excess
output = output.slice(0, output.used);

process.stdout.write(output);
}
