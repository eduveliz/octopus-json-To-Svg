const opentype = require('opentype.js')
const DEFAULT_FONT = require('path').join(__dirname, '../fonts/din-Regular.ttf');

function parseAnchorOption(anchor) {
    let horizontal = anchor.match(/left|center|right/gi) || [];
    horizontal = horizontal.length === 0 ? 'left' : horizontal[0];

    let vertical = anchor.match(/baseline|top|bottom|middle/gi) || [];
    vertical = vertical.length === 0 ? 'baseline' : vertical[0];

    return {horizontal, vertical};
}

class TextToSVG {
    constructor(font) {
        this.font = font;
    }

    static loadSync(file = DEFAULT_FONT) {
        return new TextToSVG(opentype.loadSync(file));
    }

    static load(url, cb) {
        opentype.load(url, (err, font) => {
            if (err !== null) {
                return cb(err, null);
            }

            return cb(null, new TextToSVG(font));
        });
    }

    getWidth(text, options) {
        const fontSize = options.fontSize || 72;
        const kerning = 'kerning' in options ? options.kerning : true;
        const fontScale = 1 / this.font.unitsPerEm * fontSize;

        let width = 0;
        const glyphs = this.font.stringToGlyphs(text);
        for (let i = 0; i < glyphs.length; i++) {
            const glyph = glyphs[i];

            if (glyph.advanceWidth) {
                width += glyph.advanceWidth * fontScale;
            }

            if (kerning && i < glyphs.length - 1) {
                const kerningValue = this.font.getKerningValue(glyph, glyphs[i + 1]);
                width += kerningValue * fontScale;
            }

            if (options.letterSpacing) {
                width += options.letterSpacing * fontSize;
            } else if (options.tracking) {
                width += (options.tracking / 1000) * fontSize;
            }
        }
        return width;
    }

    getHeight(fontSize) {
        const fontScale = 1 / this.font.unitsPerEm * fontSize;
        return (this.font.ascender - this.font.descender) * fontScale;
    }

    getMetrics(text, options = {}) {
        const fontSize = options.fontSize || 72;
        const anchor = parseAnchorOption(options.anchor || '');

        const width = this.getWidth(text, options);
        const height = this.getHeight(fontSize);

        const fontScale = 1 / this.font.unitsPerEm * fontSize;
        const ascender = this.font.ascender * fontScale;
        const descender = this.font.descender * fontScale;

        let x = options.x || 0;

        console.log(width)
        switch (anchor.horizontal) {
            case 'left':
                x = 0;
                console.log(x)
                break;
            case 'center':
                x = width / 2;
                console.log(x)
                break;
            case 'right':
                x = width;
                console.log(x)
                break;
            default:
                throw new Error(`Unknown anchor option: ${anchor.horizontal}`);
        }

        let y = options.y || 0;
        switch (anchor.vertical) {
            case 'baseline':
                y = ascender;
                break;
            case 'top':
                y = 0;
                break;
            case 'middle':
                y = height / 2;
                break;
            case 'bottom':
                y = height;
                break;
            default:
                throw new Error(`Unknown anchor option: ${anchor.vertical}`);
        }

        const baseline = y + ascender;

        return {
            x,
            y,
            baseline,
            width,
            height,
            ascender,
            descender,
        };
    }

    getD(text, options = {}) {
        const fontSize = options.fontSize - 2 || 72;
        const kerning = 'kerning' in options ? options.kerning : true;
        const letterSpacing = 'letterSpacing' in options ? options.letterSpacing : false;
        const tracking = 'tracking' in options ? options.tracking : false;
        const path = this.font.getPath(text, 0, 0, fontSize, {kerning, letterSpacing, tracking});

        return path.toPathData();
    }

    getPath(text, options = {}) {
        const attributes = Object.keys(options.attributes || {})
            .map(key => `${key}="${options.attributes[key]}"`)
            .join(' ');
        const d = this.getD(text, options);

        if (attributes) {
            return `<path ${attributes} d="${d}"/>`;
        }
        return `<path d="${d}"/>`;
    }

    getSVG(text, options = {}) {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${options.width}" height="${options.height}">`;
        svg += this.getPath(text, options);
        svg += '</svg>';

        return svg;
    }
}

module.exports = TextToSVG
