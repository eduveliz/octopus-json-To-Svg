const fs = require("fs")
const data = require('../json/12345ai.json')
const SvgExporter = require("../svg-exporter/svg-exporter");
const TextToSVG = require("../text-svg/text-svg");
const textToSVG = TextToSVG.loadSync();

const convertFileVector = async function convertFileVector() {

    const layers = data.layers;

    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    function rgbToHex(text) {
        return "#" + componentToHex(text.styles[0].color.r) + componentToHex(text.styles[0].color.g) + componentToHex(text.styles[0].color.b);
    }

    function vectorToSvg(vectors, data) {
        // creating svg for vectors
        vectors.map(async (x, i) => {
            const exportFile = await new SvgExporter().exportSvg([vectors[i]], {
                viewBoxBounds: vectors[i].clipBounds ? vectors[i].clipBounds : data.bounds
            })
            await fs.writeFileSync(`./src/parser/svg/vectors/${i}.svg`, exportFile);
        })
    }

    async function textToSvgs(textLayers, data) {
        // create one for text
        textLayers.map(async (textLayer, i) => {
            const transform = `translate(${textLayer.text.transformMatrix.tx},${textLayer.text.transformMatrix.ty})`
            const attributes = {fill: rgbToHex(textLayer.text), stroke: 'transparent', transform: transform,};
            const options = {
                x: textLayer.text.transformMatrix.a,
                y: textLayer.text.transformMatrix.d,
                fontSize: textLayer.text.styles[0].font.size,
                anchor: 'top',
                attributes: attributes,
                letterSpacing: textLayer.text.styles[0].font.letterSpacing,
                width: data.bounds.width,
                height: data.bounds.height
            };

            const svg = textToSVG.getSVG(textLayer.text.value, options);
            await fs.writeFileSync(`./src/parser/svg/texts/${i}.svg`, svg);
        })
    }

    async function textToSvg(textLayers, data) {
        // all texts in one svg
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${data.bounds.width}" height="${data.bounds.height}">`;
        textLayers.map(async (textLayer, i) => {
            const transform = `translate(${textLayer.text.transformMatrix.tx},${textLayer.text.transformMatrix.ty})`
            const attributes = {fill: rgbToHex(textLayer.text), stroke: 'transparent', transform: transform,};
            const options = {
                x: textLayer.text.transformMatrix.a,
                y: textLayer.text.transformMatrix.d,
                fontSize: textLayer.text.styles[0].font.size,
                anchor: 'top middle',
                attributes: attributes,
                letterSpacing: textLayer.text.styles[0].font.letterSpacing,
                width: data.bounds.width,
                height: data.bounds.height
            };
            svg += textToSVG.getPath(textLayer.text.value, options);
        })
        svg += '</svg>'

        await fs.writeFileSync(`./src/parser/svg/text/text.svg`, svg);
        console.log('svg texts complete')
    }

    try {
        layers.map(async (parentLayer, index) => {
            if (parentLayer.type === 'groupLayer') {
                const vectors = []
                const textLayers = []

                const childLayers = await layers.map((child) => {
                    if (child.type === 'groupLayer') {
                        return child.layers
                    }
                })

                let allLayers = await childLayers.flatMap((a) => {
                    return a
                });

                // filter only vectors
                allLayers = allLayers.map((e) => {
                    if (e.type === 'shapeLayer') {
                        vectors.push(e)
                        return e
                    } else {
                        if (e.type === 'textLayer' && e.visible === true) {
                            textLayers.push(e)
                        }
                    }
                })

                await vectorToSvg(vectors, data)
                await textToSvg(textLayers, data)
                await textToSvgs(textLayers, data)

            } else if (parentLayer.type === 'shapeLayer') {
                const exportFile = await new SvgExporter().exportSvg(parentLayer, {
                    viewBoxBounds: {
                        left: data.bounds.left,
                        top: data.bounds.top,
                        width: data.bounds.width,
                        height: data.bounds.height,
                    }
                })
                await fs.writeFileSync(`./src/parser/svg/${parentLayer.name}.svg`, exportFile);

            } else {
                console.log('normal parse process')
            }
        })

    } catch (e) {
        console.log(e)
    }
}

convertFileVector()
