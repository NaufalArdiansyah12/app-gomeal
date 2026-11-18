/**
 * Minimal ISO/IEC 18004 QR Code generator (Byte mode, ECC Level M, Versions 1-10).
 * ponytail: supports up to 213 UTF-8 bytes; upgrade to `qrcode` npm package if larger payloads or ECC levels are needed.
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const factor = GF_EXP[i];
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], factor);
        }
        poly = next;
    }
    return poly;
}

function rsEncode(data, ecCount) {
    const gen = rsGeneratorPoly(ecCount);
    const rem = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ rem[0];
        for (let j = 0; j < ecCount - 1; j++) {
            rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor);
        }
        rem[ecCount - 1] = gfMul(gen[ecCount], factor);
    }
    return rem;
}

// Version specs for ECC Level M: [version, dataCodewords, ecPerBlock, blocksG1, dataG1, blocksG2, dataG2, alignCoords]
const VERSIONS_M = [
    null,
    [1, 16, 10, 1, 16, 0, 0, []],
    [2, 28, 16, 1, 28, 0, 0, [6, 18]],
    [3, 44, 26, 1, 44, 0, 0, [6, 22]],
    [4, 64, 18, 2, 32, 0, 0, [6, 26]],
    [5, 86, 24, 2, 43, 0, 0, [6, 30]],
    [6, 108, 16, 4, 27, 0, 0, [6, 34]],
    [7, 124, 18, 4, 31, 0, 0, [6, 22, 38]],
    [8, 154, 22, 2, 38, 2, 39, [6, 24, 42]],
    [9, 182, 22, 3, 36, 2, 37, [6, 26, 46]],
    [10, 216, 26, 4, 43, 1, 44, [6, 28, 50]],
];

function computeFormatBits(mask) {
    // ECC Level M = 00
    const data = (0b00 << 3) | mask;
    let rem = data << 10;
    for (let i = 4; i >= 0; i--) {
        if (rem & (1 << (i + 10))) rem ^= 0x537 << i;
    }
    return ((data << 10) | rem) ^ 0x5412;
}

function computeVersionBits(version) {
    let rem = version << 12;
    for (let i = 5; i >= 0; i--) {
        if (rem & (1 << (i + 12))) rem ^= 0x1f25 << i;
    }
    return (version << 12) | rem;
}

function encodeData(bytes, spec) {
    const [version, dataCap, ecPerBlock, b1, d1, b2, d2] = spec;
    const bits = [];
    const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };

    // Byte mode indicator (0100)
    pushBits(0b0100, 4);
    pushBits(bytes.length, version >= 10 ? 16 : 8);
    for (const b of bytes) pushBits(b, 8);

    const maxBits = dataCap * 8;
    const termLen = Math.min(4, maxBits - bits.length);
    pushBits(0, termLen);
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
        codewords.push(byte);
    }

    const pads = [0xec, 0x11];
    let padIdx = 0;
    while (codewords.length < dataCap) {
        codewords.push(pads[padIdx++ % 2]);
    }

    // Split into blocks & compute ECC
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let i = 0; i < b1; i++) {
        const blk = codewords.slice(offset, offset + d1);
        offset += d1;
        dataBlocks.push(blk);
        ecBlocks.push(rsEncode(blk, ecPerBlock));
    }
    for (let i = 0; i < b2; i++) {
        const blk = codewords.slice(offset, offset + d2);
        offset += d2;
        dataBlocks.push(blk);
        ecBlocks.push(rsEncode(blk, ecPerBlock));
    }

    // Interleave data and ECC codewords
    const result = [];
    const maxDataLen = Math.max(d1, d2);
    for (let i = 0; i < maxDataLen; i++) {
        for (const blk of dataBlocks) {
            if (i < blk.length) result.push(blk[i]);
        }
    }
    for (let i = 0; i < ecPerBlock; i++) {
        for (const ec of ecBlocks) result.push(ec[i]);
    }
    return result;
}

const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function penaltyScore(grid, size) {
    let score = 0;
    // Rule 1: consecutive modules in row/col
    for (let r = 0; r < size; r++) {
        let runRow = 1;
        let runCol = 1;
        for (let c = 1; c < size; c++) {
            if (grid[r][c] === grid[r][c - 1]) {
                runRow++;
            } else {
                if (runRow >= 5) score += 3 + (runRow - 5);
                runRow = 1;
            }
            if (grid[c][r] === grid[c - 1][r]) {
                runCol++;
            } else {
                if (runCol >= 5) score += 3 + (runCol - 5);
                runCol = 1;
            }
        }
        if (runRow >= 5) score += 3 + (runRow - 5);
        if (runCol >= 5) score += 3 + (runCol - 5);
    }
    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const v = grid[r][c];
            if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) {
                score += 3;
            }
        }
    }
    // Rule 4: dark ratio
    let dark = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) if (grid[r][c]) dark++;
    }
    const pct = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
}

export function generateQrMatrix(text) {
    const bytes = new TextEncoder().encode(String(text || ''));
    let spec = null;
    for (let v = 1; v < VERSIONS_M.length; v++) {
        const s = VERSIONS_M[v];
        const headerBits = 4 + (v >= 10 ? 16 : 8);
        if (headerBits + bytes.length * 8 <= s[1] * 8) {
            spec = s;
            break;
        }
    }
    if (!spec) {
        throw new Error('QR payload too long (max 213 bytes)');
    }

    const version = spec[0];
    const alignCoords = spec[7];
    const size = version * 4 + 17;
    const base = Array.from({ length: size }, () => new Uint8Array(size));
    const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

    const setFunc = (r, c, val) => {
        if (r >= 0 && r < size && c >= 0 && c < size) {
            base[r][c] = val ? 1 : 0;
            isFunc[r][c] = 1;
        }
    };

    // Finder patterns + separators
    const drawFinder = (tr, tc) => {
        for (let dr = -1; dr <= 7; dr++) {
            for (let dc = -1; dc <= 7; dc++) {
                const r = tr + dr;
                const c = tc + dc;
                const dist = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
                const dark = dist !== 2 && dist !== 4;
                setFunc(r, c, dark);
            }
        }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
        setFunc(6, i, i % 2 === 0);
        setFunc(i, 6, i % 2 === 0);
    }

    // Alignment patterns
    for (const r of alignCoords) {
        for (const c of alignCoords) {
            if (isFunc[r][c]) continue;
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    setFunc(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
                }
            }
        }
    }

    // Reserve format info & dark module
    for (let i = 0; i < 9; i++) {
        if (i !== 6) {
            setFunc(8, i, 0);
            setFunc(i, 8, 0);
        }
    }
    for (let i = 0; i < 8; i++) {
        setFunc(8, size - 1 - i, 0);
        setFunc(size - 1 - i, 8, 0);
    }
    setFunc(size - 8, 8, 1);

    // Version info for version >= 7
    if (version >= 7) {
        const vBits = computeVersionBits(version);
        for (let i = 0; i < 18; i++) {
            const bit = (vBits >>> i) & 1;
            const a = Math.floor(i / 3);
            const b = size - 11 + (i % 3);
            setFunc(a, b, bit);
            setFunc(b, a, bit);
        }
    }

    // Place data bits
    const codewords = encodeData(bytes, spec);
    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let upward = true;
    for (let col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col--;
        for (let step = 0; step < size; step++) {
            const row = upward ? size - 1 - step : step;
            for (let dx = 0; dx < 2; dx++) {
                const c = col - dx;
                if (!isFunc[row][c]) {
                    const bit = bitIdx < totalBits
                        ? (codewords[bitIdx >> 3] >>> (7 - (bitIdx & 7))) & 1
                        : 0;
                    base[row][c] = bit;
                    bitIdx++;
                }
            }
        }
        upward = !upward;
    }

    // Try all 8 masks and pick lowest penalty
    let bestGrid = null;
    let bestScore = Infinity;
    for (let m = 0; m < 8; m++) {
        const grid = base.map((row) => new Uint8Array(row));
        const maskFn = MASK_FNS[m];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!isFunc[r][c] && maskFn(r, c)) grid[r][c] ^= 1;
            }
        }
        // Write format info
        const fmt = computeFormatBits(m);
        const coords1 = [
            [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
            [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
        ];
        for (let i = 0; i < 15; i++) {
            const bit = (fmt >>> (14 - i)) & 1;
            const [r1, c1] = coords1[i];
            grid[r1][c1] = bit;
            if (i < 7) {
                grid[size - 1 - i][8] = bit;
            } else {
                grid[8][size - 15 + i] = bit;
            }
        }
        const score = penaltyScore(grid, size);
        if (score < bestScore) {
            bestScore = score;
            bestGrid = grid;
        }
    }

    return bestGrid;
}

export function qrToSvgDataUrl(text, { fg = '#111111', bg = '#FFFFFF', margin = 2 } = {}) {
    const matrix = generateQrMatrix(text);
    const size = matrix.length;
    const total = size + margin * 2;
    let d = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                d += `M${c + margin},${r + margin}h1v1h-1z`;
            }
        }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
