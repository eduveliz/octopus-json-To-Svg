const fs = require("fs")
const data = require('../json/12345ai.json')
const SvgExporter = require("../svg-exporter/svg-exporter");

const convertFileVector = async function convertFileVector() {
    const layers = data.layers;
    try {
        layers.map(async (parentLayer, index) => {
            if (parentLayer.type === 'groupLayer') {
                const vectors = [];

                const childLayers = await layers.map((child) => {
                    if (child.type === 'groupLayer') {
                        return child.layers
                    }
                })

                let allLayers = childLayers.flatMap((a) => {
                    return a
                });

                // filter only vectors
                allLayers.map((e) => {
                    if (e.type === 'shapeLayer') {
                        console.log('vector')
                        vectors.push(e)
                        return e
                    } else {
                        console.log('text or image ')
                    }
                })

                // map and create svg
                vectors.map(async (x, i) => {
                    const exportFile = await new SvgExporter().exportSvg([vectors[i]], {
                        viewBoxBounds: vectors[i].clipBounds ? vectors[i].clipBounds : data.bounds
                    })
                    await fs.writeFileSync(`./src/parser/svg/${i}.svg`, exportFile);
                })

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
