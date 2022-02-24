"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, {
        enumerable: true, get: function () {
            return m[k];
        }
    });
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", {enumerable: true, value: v});
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function (resolve) {
            resolve(value);
        });
    }

    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }

        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {"default": mod};
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.SvgExporter = void 0;
const fs_1 = require("fs");
const cancel_token_1 = __importDefault(require("@avocode/cancel-token"));
const index_node_1 = __importDefault(require("@avocode/svg-exporter/lib/index-node"));
const image_type_1 = __importDefault(require("image-type"));

class SvgExporter {
    constructor(params = {}) {
        this._destroyTokenController = (0, cancel_token_1.default)();
        this._console = params.console || console;
    }

    exportSvg(layerOctopusDataList, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const {bitmapAssetFilenames = {}, scale = 1, cancelToken: operationCancelToken} = options,
                svgOptions = __rest(options, ["bitmapAssetFilenames", "scale", "cancelToken"]);
            const cancelToken = cancel_token_1.default.race([
                operationCancelToken,
                this._destroyTokenController.token,
            ]);
            const bitmaps = yield this._loadBitmapAssets(bitmapAssetFilenames, {
                cancelToken,
            });
            this._console.debug('SvgExporter:', 'creating SVG');
            const [canvas, svgdom] = yield Promise.all([
                Promise.resolve().then(() => __importStar(require('canvas'))),
                Promise.resolve().then(() => __importStar(require('svgdom'))),
            ]);
            cancelToken.throwIfCancelled();
            return (0, index_node_1.default)(layerOctopusDataList, Object.assign(Object.assign({
                scale,
                bitmaps
            }, svgOptions), {
                env: {
                    canvas: canvas.default,
                    svgdom: svgdom.createSVGWindow(),
                }
            }));
        });
    }

    destroy() {
        this._destroyTokenController.cancel('The SVG exporter has been destroyed.');
    }

    _loadBitmapAssets(bitmapAssetFilenames, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const bitmapAssetNames = Object.keys(bitmapAssetFilenames);
            this._console.debug('SvgExporter:', 'loading bitmaps for export', bitmapAssetNames.length);
            const bitmapEntries = yield Promise.all(bitmapAssetNames.map((name) => __awaiter(this, void 0, void 0, function* () {
                const bitmapAssetFilename = bitmapAssetFilenames[name];
                if (!bitmapAssetFilename) {
                    throw new Error('Missing bitmap file name');
                }
                return [name, yield this._loadBitmapAsset(bitmapAssetFilename, params)];
            })));
            params.cancelToken.throwIfCancelled();
            return Object.fromEntries(bitmapEntries);
        });
    }

    _loadBitmapAsset(bitmapAssetFilename, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const imageBuffer = yield fs_1.promises.readFile(bitmapAssetFilename);
            params.cancelToken.throwIfCancelled();
            const type = (0, image_type_1.default)(imageBuffer.slice(0, image_type_1.default.minimumBytes));
            const mimeType = type ? type.mime : '';
            return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        });
    }
}

module.exports = SvgExporter
//# sourceMappingURL=svg-exporter.js.map