importPackage(java.io);
importPackage(java.nio.charset);
importClass(Packages.mtr.mappings.Utilities);
importPackage(java.awt.image);
include(Resources.id("fangsu:scripts/gif_helper.js"));
include(Resources.id("fangsu:scripts/online_res_helper.js"));
include(Resources.id("fangsu:scripts/text_util.js"));

/**
 * 在用“||”分割的字符串中，返回“||”之前的所有字符。
 * 如果源字符串不使用“||”分割，则返回该字符串。
 * @param {String} src 源字符串。
 * @returns {String}
 */
function getNonExtraParts(src) {
    return src.includes("||") ? TextUtil.getNonExtraParts(src) : src;
}

function getExtraParts(src) {
    return src.includes("||") ? TextUtil.getExtraParts(src) : src;
}

/**
 * 在用“|”分割的字符串中，获取其中的 CJK / 非 CJK 部分。
 * 如果源字符串不使用“|”分割，但使用“||”分割，则返回“||”之前的所有字符。
 * 如果源字符串既不使用“|”分割，也不使用“||”分割，则返回该字符串。
 * 如果源字符串多次使用“|”分割，则判断每个部分是否为 CJK 字符，并返回符合条件的所有部分。每个部分间用空格分割。
 * @param {String} src 源字符串。
 * @param {Boolean} isCjk 指定获取字符串中的 CJK 还是非 CJK 部分。
 * @returns {String}
 */
function getMatching(src, isCjk) {
    if (src) {
        src = String(src);
        if (!src.includes("|")) {
            return isCjk ? TextUtil.isCjk(src) ? getNonExtraParts(src) : "" : TextUtil.isCjk(src) ? "" : getNonExtraParts(src);
        }
        return isCjk ? TextUtil.getCjkParts(src) : TextUtil.getNonCjkParts(src);
    }
    return "";
}

/**
 * 提取源字符串“||”之前的所有字符，然后将所有“|”替换成空格。
 * @param {String} name 源字符串。
 * @returns {String}
 */
function formatName(name) {
    return getNonExtraParts(name).replace('|', ' ');
}

/**
 * 通过键名从列表中获取对应值
 * @param {Object} map - 类似Java的Map结构对象(需实现entrySet方法)
 * @param {*} key - 要查找的键值(使用宽松相等判断 == )
 * @returns {*|undefined} 返回第一个匹配键对应的值，未找到返回undefined
 */
function getMapValueByKey(map, key) {
    for (let entry of map.entrySet()) {
        if (entry.getKey() == key) {
            return entry.getValue();
        }
    }
}

/**
 * 通过索引位置从列表中获取对应值
 * @param {Object} map - 类似Java的Map结构对象(需实现entrySet方法)
 * @param {number} index - 要获取的索引位置(从0开始)
 * @returns {*} 返回对应索引位置的值
 * @throws {Error} 当索引超出范围时抛出异常
 */
function getMapValueByIndex(map, index) {
    let iterator = map.entrySet().iterator();

    for (let i = 0; i < index && iterator.hasNext(); i++) {
        iterator.next();
    }

    if (iterator.hasNext()) {
        return iterator.next().getValue();
    }

    throw new Error("Map does not contain " + index + " elements");
}

/**
 * 检查某个属性是否存在于对象中，并且属性的 JSON 字符串表示形式等于给定对象的 JSON 字符串表示形式。
 * @param {*} obj 要检查的属性所在的对象。
 * @param {*} propName 要检查的属性名称字符串。
 * @param {*} propValue 要检查的属性值。
 * @returns 
 */
function checkJsonProperty(obj, propName, propValue) {
    return (obj != null && propName in obj) ? JSON.stringify(obj[propName]) == JSON.stringify(propValue) : false;
}

/**
 * 检查某个属性是否存在于对象中，并且属性值等于给定的值。
 * @param {*} obj 要检查的属性所在的对象。
 * @param {*} propName 要检查的属性名称字符串。
 * @param {*} propValue 要检查的属性值。
 * @returns 
 */
function checkProperty(obj, propName, propValue) {
    return (obj != null && propName in obj) ? obj[propName] == propValue : false;
}

function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

function warn(message) {
    MinecraftClient.displayMessage("§e§l" + message, false);
}

/**
 * 动态加载资源, 避免重复加载导致卡顿
 * @param {Object} res 需在函数外创建res对象
 * @param {String} type 资源类别("font" "image" "str")
 * @param {String} path 资源路径
 * @returns 
 */
function loadRes(res, type, path) {
    return loadResource(type, path);
}
/**
 * 动态加载资源并缓存结果，避免重复加载导致的性能问题
 * 
 * @param {string} type - 资源类型，支持以下值：
 *   - "font"：字体资源
 *   - "image" 或 "img"：静态图片
 *   - "model"：原始模型
 *   - "partedModel"：分块模型
 *   - "str"：文本内容
 *   - "json"：JSON 对象（自动合并多个资源文件）
 *   - "gif"：GIF 动画
 *   - "webimg" 或 "webImg"：网络图片
 *   - "webgif" 或 "webGif"：网络 GIF
 * @param {string} path - 资源路径标识符（如 "mtrsteamloco:imgnotfound.png"）
 * 
 * @returns {*} 加载的资源对象，类型取决于资源类别：
 *   - "font"：{Font} 字体对象
 *   - "image" | "img" | "webimg" | "webImg"：{BufferedImage} 图片对象
 *   - "model"：{RawModel} 原始模型对象
 *   - "partedModel"：{Object} 分块模型容器（含 get 方法）
 *   - "str"：{string} 文本内容
 *   - "json"：{Object} 合并后的 JSON 对象
 *   - "gif" | "webgif" | "webGif"：{GifPlayer} GIF 播放器对象
 * 
 * @throws {Error} 当遇到以下情况时抛出错误：
 *   - 传入未知的资源类型
 *   - 加载非 JSON 资源失败且无默认回退时
 * 
 * @description
 * 1. 优先检查全局缓存(GlobalRegister)，存在则直接返回缓存结果
 * 2. 对网络资源("webimg", "webgif")使用 WebImageLoader 加载
 * 3. JSON 资源会合并所有同名资源文件属性（数组会连接，对象会合并）
 * 4. 加载失败时返回默认资源（如图片加载失败返回 404 图片）
 * 5. 所有成功加载的资源会自动存入 GlobalRegister 缓存
 */
function loadResource(type, path) {
    if (type == "webimg" || type == "webImg") {
        return WebImageLoader.load(path);
    }
    if (type == "webgif" || type == "webGif") {
        return WebImageLoader.load(path);
    }
    if (GlobalRegister.containsKey(path)) return GlobalRegister.get(path);
    let resL = null;
    try {
        if (type == "font") resL = Resources.readFont(Resources.id(path));
        else if (type == "image" || type == "img") resL = Resources.readBufferedImage(Resources.id(path));
        else if (type == "model") resL = ModelManager.loadRawModel(Resources.manager(), Resources.id(path), null);
        else if (type == "partedModel") resL = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id(path), null);
        else if (type == "str") resL = Resources.readString(Resources.id(path));
        else if (type == "json" || type == "JSON") {
            let resList = UtilitiesClient.getResources(Resources.manager(), Resources.id(path));
            let jsonList = [];
            resL = {};
            // print(resList);
            for (let res of resList) {
                let inputStream = Packages.mtr.mappings.Utilities.getInputStream(res);
                let inputStreamStr = inputStreamToString(inputStream)
                // print("[DEBUG] input: ", inputStreamStr);
                jsonList.push(JSON.parse(inputStreamStr));
                // print("[DEBUG] resL: ", JSON.stringify(resL));
                for (let prop in JSON.parse(inputStreamStr)) {
                    var propItem = JSON.parse(inputStreamStr)[prop];
                    // print("[DEBUG] type of propItem ", typeof (propItem));
                    // print("[DEBUG] type of resL ", Object.prototype.toString.call(resL[prop]));
                    if (resL[prop]) {
                        if (typeof (resL[prop]) !== typeof (propItem)) {
                            resL[prop] = propItem;
                        } else {
                            if (typeof (resL[prop]) == "object") {
                                if (Object.prototype.toString.call(resL[prop]) == "[object Array]") {
                                    resL[prop] = resL[prop].concat(propItem);
                                } else if (Object.prototype.toString.call(resL[prop]) === '[object Object]') {
                                    resL[prop] = Object.assign(resL[prop], propItem);
                                }
                            }
                            else {
                                resL[prop] = propItem;
                            }
                        }
                    } else resL[prop] = propItem;
                }
            }
            // resL = deepMergeArray(jsonList);
            // print(JSON.stringify(resL))
        }
        else if (type == "gif") {
            resL = new GifPlayer(path);
        }

        else throw new Error("Unknown res type: " + String(type));
    }
    catch (e) {
        if (type == "font") resL = Resources.getSystemFont("SansSerif");
        else if (type == "image" || type == "img") resL = Resources.readBufferedImage(Resources.id("mtrsteamloco:imgnotfound.png"));
        else if (type == "model") resL = loadResource("model", "fangsu:err/not_found.obj");
        else if (type == "partedModel") {
            resL = {};
            resL.get = item_name => { loadResource("model", "fangsu:err/unknown_model.obj"); };
        }
        else if (type == "str") resL = "?";
        else if (type == "json" || type == "JSON") resL = {};
        else if (type == "gif") {
            resL = new GifPlayer("mtrsteamloco:imgnotfound.gif");
        }
        else setErrorInfo("Error occured when loading " + String(path) + " " + String(type) + "\n" + e);
    }
    GlobalRegister.put(path, resL);
    return resL;
}

function getByPath(obj, path) {
    return path.split('.').reduce((o, key) => o[key], obj);
}

function parseObj(o) {
    if (!o) return { error: "o is empty" };
    let o1 = {};
    for (let ot of o) {
        o1[ot.id] = ot;
    }
    return o1;
}

function getPlatformById(id) {
    for (let route of MTRClientData.PLATFORMS) {
        if (String(new java.lang.Long(route.id)) === id) {
            return route;
        }
    }
    return null;
}

function getRouteByPlatform(plat) {
    return MTRClientData.DATA_CACHE.requestPlatformIdToRoutes(new java.lang.Long(plat.id));
}

function getRouteWithCondition(con) {
    let routes = [];
    let routeList = MTRClientData.ROUTES;
    for (let c of con) {
        if (c.type == "platform" || c.type == "platformId") {
            let platform = c.val;
            for (let route of routeList) {
                // print(route.platformIds)
                for (let routePlatform of route.platformIds) {
                    // print(String(new java.lang.Long(routePlatform.platformId)))
                    if (new java.lang.Long(routePlatform.platformId) == new java.lang.Long(c.type == "platformId" ? c.val : (platform.id))) {
                        routes.push(route);
                    }
                }

            }
        } else if (c.type == "name") {
            let targetName = c.name;
            for (let route of routeList) {
                // print(route.name)
                if (route.name == targetName) {
                    routes.push(route);
                }
            }
        }
        routeList = routes;
    }
    return routes;
}

function getRouteById(id) {
    for (let route of MTRClientData.ROUTES) {
        if (String(new java.lang.Long(route.id)) === String(new java.lang.Long(id))) {
            return route;
        }
    }
    return null;
}

/**
 * 获取某个站台所在的车站
 * @param {Platform} plat 站台
 * @returns Station
 */
function getStationByPlatform(plat) {
    var posCentral = new Vector3f(plat.getMidPos());
    return MinecraftClient.getStationAt(posCentral);
}

function getPlatformByStation(station) {
    let platforms = MTRClientData.DATA_CACHE.requestStationIdToPlatforms(new java.lang.Long(station.id));
    return Array.from(platforms.values());
}

function getDestinationByRouteId(id) {
    let route = getRouteById(String(id));
    // print(String(id), "  ", (route))
    if (route == null) return "?";
    let destinationRoutePlatform = route.platformIds[route.platformIds.size() - 1];
    let destinationPlatform = getPlatformById(String(new java.lang.Long(destinationRoutePlatform.platformId)));
    let station = getStationByPlatform(destinationPlatform);
    // print(destinationPlatform);
    // print(destinationPlatform.getMidPos());
    // print(station);
    return station.name;
}

function getDestinationByPlatform(plat) {
    if (!plat) return [];
    var destSet = new Set();
    getRouteWithCondition([{ type: "platform", val: plat }]).forEach(route => {
        var platforms = route.platformIds;
        if (platforms.size() > 0) {
            var lastPlat = platforms.get(platforms.size() - 1);
            var station = getStationByPlatform(getPlatformById(String(new java.lang.Long(lastPlat.platformId))));
            station.name && destSet.add("" + station.name); // 显式转为JS字符串
        }
    });

    return Array.from(destSet);
}

function getDestinationByPlatId(id) {
    var plat = getPlatformById(String(id));
    return getDestinationByPlatform(plat);
}

function findStation(station, stationList) {
    // print(String(station.name))
    for (let i = 0; i < stationList.length; i++) {
        let currentStation = stationList[i];
        // print(String(currentStation.stationName));
        if (station.name === currentStation.stationName) return i;
    }
    return -1;
}

function routeToObj(route) {
    let drawStations = [];
    if (route.stationDetails == null) drawStations = [];
    else for (let station of route.stationDetails) {
        let transferInfo = [];
        if (station.interchangeInfo) {
            for (interchange of station.interchangeInfo) {
                if (interchange.isConnectingStation) continue;
                if (getNonExtraParts(interchange.name) == getNonExtraParts(route.routeName)) continue;
                transferInfo.push({ routeName: interchange.name, routeColor: interchange.color });
            }
            drawStations.push({ stationName: station.stationName, transInfo: transferInfo });
        } else if (station.interchangeRoutes) {
            for (interchange of station.interchangeRoutes) {
                if (interchange.isConnectingStation) continue;
                if (getNonExtraParts(interchange.name) == getNonExtraParts(route.routeName)) continue;
                transferInfo.push({ routeName: interchange.name, routeColor: intToColor(interchange.color) });
            }
            drawStations.push({ stationName: station.stationName, transInfo: transferInfo });
        }
        else drawStations.push({ stationName: station.stationName, transInfo: [] });
    }
    return {
        routeName: route.routeName,
        routeColor: route.routeColor,
        destination: route.destination,
        circularState: route.circularState,
        depotName: route.depotName,
        stationDetails: route.stationDetails,
        drawStations
    }
}

/**
 * 将Java输入数据流转换为字符串
 * @param {java.io.InputStream|ByteArray} inputStream - 输入流或字节数组
 * @returns {string} 转换后的字符串
 */
function inputStreamToString(input) {
    var is = new java.io.DataInputStream(input); // 尝试将输入对象转换为 DataInputStream
    var baos = new java.io.ByteArrayOutputStream();
    var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
    try {
        var bytesRead;
        while ((bytesRead = is.read(buffer)) !== -1) {
            baos.write(buffer, 0, bytesRead);
        }
        return baos.toString("UTF-8");
    } finally {
        is.close(); // 确保流关闭
    }
}

/**
 * 深度合并对象数组为单个对象。
 * - 使用 JSON.parse/stringify 解析和克隆每个对象
 * - 如果存在时间戳字符串，则将其转换为 Date 对象
 * - 跳过没有 'id' 属性的对象
 * - 递归合并对象，连接数组
 * 
 * @param {Array<Object>} arr - 要合并的对象数组
 * @returns {Object} 合并后的结果对象
 */
function deepMergeArray(arr) {
    let result = {};

    for (let item of arr) {
        let parsedItem;

        try {
            // 克隆对象以避免修改原始对象
            parsedItem = JSON.parse(JSON.stringify(item));

            // 如果存在时间戳字符串，则将其转换为 Date 对象
            if (parsedItem.timestamp) {
                parsedItem.timestamp = new Date(parsedItem.timestamp);
            }

            // 跳过没有 id 的项
            if (!parsedItem.id) {
                continue;
            }
        } catch (error) {
            continue;
        }

        /**
         * 将源对象递归合并到目标对象中
         * @param {Object} target - 要合并到的目标对象
         * @param {Object} source - 要从中合并的源对象
         * @returns {Object} 合并后的目标对象
         */
        function merge(target, source) {
            for (var key in source) {
                if (!Object.prototype.hasOwnProperty.call(source, key)) {
                    continue;
                }

                var sourceValue = source[key];
                var targetValue = target[key];

                if (sourceValue && typeof sourceValue === 'object') {
                    target[key] = Array.isArray(sourceValue)
                        ? (targetValue || []).concat(sourceValue)
                        : merge(targetValue || {}, sourceValue);
                } else {
                    target[key] = sourceValue;
                }
            }
            return target;
        }

        result = merge(result, parsedItem);
    }

    return result;
}




function addPrefix(str, prefix, addSpace) {
    let orinCjk = getMatching(str, true);
    let orinNonCjk = getMatching(str, false);
    let finalCjk = orinCjk;
    let finalNonCjk = orinNonCjk;
    if (orinCjk != "") finalCjk = getMatching(prefix, true) + (addSpace ? " " : "") + orinCjk;
    if (orinNonCjk != "") finalNonCjk = getMatching(prefix, false) + (addSpace ? " " : "") + orinNonCjk;
    if (finalCjk != "" && finalNonCjk != "") return finalCjk + "|" + finalNonCjk;
    if (finalCjk == "" && finalNonCjk != "") return finalNonCjk;
    if (finalCjk != "" && finalNonCjk == "") return finalCjk;
}

importPackage(java.awt);
importPackage(java.awt.image);

function convertToGrayscaleDarkened(bufferedImage) {
    // 1. 创建灰度转换器
    let colorConvertOp = new ColorConvertOp(
        ColorSpace.getInstance(ColorSpace.CS_GRAY),
        null
    );

    // 2. 应用灰度转换
    let grayImage = new BufferedImage(
        bufferedImage.getWidth(),
        bufferedImage.getHeight(),
        BufferedImage.TYPE_BYTE_GRAY
    );
    colorConvertOp.filter(bufferedImage, grayImage);

    // 3. 进一步变暗（通过调整亮度）
    let darkenedImage = new BufferedImage(
        grayImage.getWidth(),
        grayImage.getHeight(),
        BufferedImage.TYPE_BYTE_GRAY
    );
    let g = darkenedImage.createGraphics();
    g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.7)); // 透明度降低 = 变暗
    g.drawImage(grayImage, 0, 0, null);
    g.dispose();

    return darkenedImage;
}

function drawWaterPrint(g, w, h) {
    g.setColor(rgbaToColor(166, 166, 188, 50));
    let font = loadResource("font", "mtrsteamloco:fonts/ae.ttf");
    let versionJSON = loadResource("str", "fangsu:version.json");
    let versionObj = JSON.parse(versionJSON);
    let dispName = ComponentUtil.getString(ComponentUtil.translatable("cfg.version." + versionObj.ver)) + " " + versionObj.name;
    let currentY = h * 0.85;
    drawStrDL(g, font, font, ComponentUtil.getString(ComponentUtil.translatable("cfg.version")), w * 0.97, currentY, h * 0.02, 2, 2); currentY += h * 0.02;
    drawStrDL(g, font, font, dispName, w * 0.97, currentY, h * 0.02, 2, 2); currentY += h * 0.02;
    drawStrDL(g, font, font, "方速方块包 FangSu Blocks", w * 0.97, currentY, h * 0.02, 2, 2); currentY += h * 0.02;
    drawStrDL(g, font, font, "代码 Code By 596wjr", w * 0.97, currentY, h * 0.02, 2, 2); currentY += h * 0.02;
    if (versionObj.ver == "release") {
        drawStrDL(g, font, font, "前往 https://afdian.com/a/596wjr 支持我", w * 0.97, currentY, h * 0.02, 2, 2); currentY += h * 0.02;
        drawStrDL(g, font, font, "Support me at https://afdian.com/a/596wjr", w * 0.97, currentY, h * 0.02, 2, 2); currentY += h * 0.02;
    }
    return;
}

// 获取系统剪贴板内容
function getClipboard() {
    let result = { value: null, error: null };
    try {
        // 必须在主线程执行
        MinecraftClient.execute(() => {
            try {
                let toolkit = java.awt.Toolkit.getDefaultToolkit();
                let clipboard = toolkit.getSystemClipboard();
                let contents = clipboard.getContents(null);

                if (contents && contents.isDataFlavorSupported(java.awt.datatransfer.DataFlavor.stringFlavor)) {
                    result.value = String(contents.getTransferData(java.awt.datatransfer.DataFlavor.stringFlavor));
                }
            } catch (e) {
                result.error = "Clipboard access error: " + e;
            }
        });
    } catch (e) {
        result.error = "Execution error: " + e;
    }
    return result;
}

// 设置系统剪贴板内容
function setClipboard(str) {
    let result = { success: false, error: null };
    try {
        // 必须在主线程执行
        MinecraftClient.execute(() => {
            try {
                let stringSelection = new java.awt.datatransfer.StringSelection(String(str));
                let toolkit = java.awt.Toolkit.getDefaultToolkit();
                let clipboard = toolkit.getSystemClipboard();

                clipboard.setContents(stringSelection, null);
                result.success = true;
            } catch (e) {
                result.error = "Clipboard set error: " + e;
            }
        });
    } catch (e) {
        result.error = "Execution error: " + e;
    }
    return result;
}

function setDebugInfo(str) {
    MinecraftClient.displayMessage("[§3§lDEBUG§r] " + str, false);
    print("[DEBUG] ", str);
}
function setWarnInfo(str) {
    MinecraftClient.displayMessage("[§6§lWARN§r] " + str, false);
    print("[WARN] ", str);
}
function setErrorInfo(str) {
    MinecraftClient.displayMessage("[§3§4ERROR§r] " + str, false);
    print("[ERROR] ", str);
}