const fs = require("fs")
const data = require('../json/12345ai.json')
const SvgExporter = require("../svg-exporter/svg-exporter");

const convertFileVector = async function convertFileVector() {
    const layers = data.layers;
    try {
        layers.map(async (parentLayer, index) => {
            if (parentLayer.type === 'groupLayer') {

                const childLayers = await layers.map((layerParent) => {
                    if (layerParent.type === 'groupLayer') {
                        return layerParent.layers
                    }
                })

                let currentData = childLayers.flatMap((a) => {
                    return a
                });

                currentData = currentData.map((e) => {
                    if (e.type === 'shapeLayer') {
                        console.log('vector')
                        return e
                    } else {
                        console.log('normal parse process')
                        console.log('text or image ')
                    }
                })

                const exportFile = await new SvgExporter().exportSvg(currentData, {
                    viewBoxBounds: {
                        left: data.bounds.left,
                        top: data.bounds.top,
                        width: data.bounds.width,
                        height: data.bounds.height,
                    }
                })
                await fs.writeFileSync(`./src/parser/svg/${Math.round((new Date()).getTime() / 1000)}.svg`, exportFile);

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
