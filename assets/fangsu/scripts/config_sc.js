importPackage(java.awt);
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));
include(Resources.id("fangsu:scripts/clipboard_manager.js"));

/**
 * 构建配置项对象
 *
 * 根据不同的配置类型(type)生成对应的配置参数结构，未提供的参数属性将使用默认值。
 *
 * @typedef {Object} BaseParam
 * @property {boolean} [showConditition=true] 显示条件（当需要调用未保存内容时使用 state.cacheConfig）
 *
 * @typedef {Object} StrParam
 * @property {boolean} [showConditition=true] 显示条件
 * @property {string} [default=""] 默认文本值
 * @property {string} [whenBlankText=""] 空白时显示的提示文本
 * @property {string|boolean} [savePos=false] 保存位置 (字符串路径, 最终保存在state.config.路径或false不保存)
 * @property {number} [lines=1] 文本输入框行数
 *
 * @typedef {Object} NumParam
 * @property {boolean} [showConditition=true] 显示条件
 * @property {number} [default=0] 默认数值
 * @property {string|boolean} [savePos=false] 保存位置 (字符串路径, 最终保存在state.config.路径或false不保存)
 * @property {boolean} [isInt=false] 是否为整数
 * @property {number} [max=2147483647] 允许的最大值
 * @property {number} [min=-2147483648] 允许的最小值
 *
 * @typedef {Object} ListParam
 * @property {boolean} [showConditition=true] 显示条件
 * @property {number} [default=0] 默认选中索引
 * @property {string|boolean} [savePos=false] 保存位置 (字符串路径, 最终保存在state.config.路径或false不保存)
 * @property {Array} [listItems=[]] 列表选项数组
 *
 * @typedef {Object} FunctionParam
 * @property {boolean} [showConditition=true] 显示条件
 * @property {string} [function="print('[ERROR]...')"] 要执行的函数
 *
 * @typedef {Object} MainModelParam
 * @property {boolean} [showConditition=true] 显示条件
 *
 * @typedef {Object} SubModelParam
 * @property {boolean} [showConditition=true] 显示条件
 * @property {string} [saveKey="subModel"] 保存键名
 *
 * @param {string} text 配置项显示的文本标签
 * @param {"str"|"num"|"list"|"function"|"mainModel"|"subModel"} type 配置项类型：
 *   - `str`: 文本输入
 *   - `num`: 数字输入
 *   - `list`: 下拉列表
 *   - `function`: 函数配置（通过eval执行）
 *   - `mainModel`: 主模型配置
 *   - `subModel`: 子模型配置
 * @param {BaseParam|StrParam|NumParam|ListParam|FunctionParam|MainModelParam|SubModelParam} [param={}] 类型相关参数：
 *   - `showConditition` 所有类型通用
 *   - 类型特有参数详见各类型定义
 * @returns {Object} 配置项对象
 * @property {string} text 显示文本
 * @property {string} type 配置类型
 * @property {StrParam|NumParam|ListParam|FunctionParam|MainModelParam|SubModelParam} param 处理后的配置参数
 *
 */
function buildConfigItem(text, type, param) {
    function getShortId(obj) {
        let str = typeof obj === "string" ? obj : JSON.stringify(obj);

        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash *= 0x01000193;
        }

        return hash.toString(16);
    }
    let finalParams = {};
    if (type == "str") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            default: param.default ? param.default : "",
            whenBlankText: param.whenBlankText ? param.whenBlankText : "",
            savePos: param.savePos ? param.savePos : "str" + getShortId(param),
            lines: param.lines ? param.lines : 1
        };
    } else if (type == "num") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            default: param.default ? param.default : 0,
            savePos: param.savePos ? param.savePos : "num" + getShortId(param),
            isInt: param.isInt ? param.isInt : false,
            max: param.max ? param.max : 2147483647,
            min: param.min ? param.min : -2147483648
        };
    } else if (type == "bool") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            default: param.default ? param.default : false,
            savePos: param.savePos ? param.savePos : "bool" + getShortId(param)
        };
    } else if (type == "list") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            default: param.default ? param.default : 0,
            savePos: param.savePos ? param.savePos : "list" + getShortId(param),
            listItems: param.listItems ? param.listItems : []
        };
    } else if (type == "function") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            function: param.function ? param.function : print("[ERROR] @ConfigScreen : a function config does have available function")
        };
    } else if (type == "mainModel") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            type: param.type ? param.type : "unknown"
            //预留
        };
    } else if (type == "subModel") {
        finalParams = {
            showConditition: param.showConditition !== undefined ? param.showConditition : true,
            saveKey: param.saveKey ? param.saveKey : "subModel",
            path: param.path ? param.path : "common"
            //预留
        };
    }
    return { text, type, param: finalParams };
}

function createConfigSc(configItemList, parent, eyecandy, param) {
    let screen = new IScreen.WithTextrue(ComponentUtil.literal("screen"));
    screen.state.configPageList = configItemList;
    if (!screen.state.currentPage) screen.state.currentPage = 0;
    screen.initFunction = (screen, w, h) => {
        let state = screen.state;
        let tex = screen.texture;
        let th = tex.height;
        state.eyecandy = eyecandy;
        state.lineHeight = th / 16;
        state.w = w;
        state.h = h;
        state.rollMain = 0;
        state.roll = 0;

        state.title = param.title ? ComponentUtil.getString(ComponentUtil.translatable(param.title)) : ComponentUtil.getString(ComponentUtil.translatable("cfg.title"));

        let finalLines = 0;
        configItemList.forEach((element) => {
            if (element.type != "str") finalLines += 1;
            else finalLines += element.param.lines;
        });
        state.maxHeight = 12 * state.lineHeight - Math.max(finalLines * state.lineHeight, 12 * state.lineHeight);
        state.parent = parent;
        state.inEditing = -1;
        state.editInfo = null;
    };
    eyecandy.state.cacheConfig = {};
    configItemList.forEach((element) => {
        if ((element.type == "str" || element.type == "num" || element.type == "bool") && element.param.savePos) eyecandy.state.cacheConfig[element.param.savePos] = element.param.default;
        if (element.type == "list" && element.param.savePos) eyecandy.state.cacheConfig[element.param.savePos] = element.param.default;
    });
    if (!eyecandy.state.cacheConfig) eyecandy.state.cacheConfig = {};
    if (!eyecandy.state.config) eyecandy.state.config = {};
    screen.state.skipFirstClick = true;
    return screen;
}

function displayConfigSc(screen) {
    let configPageList = screen.state.configPageList;
    screen.renderFunction = (screen, x, y, d) => {
        let tex = screen.texture;
        // if (tex.isClosed()) { screen.texture = new GraphicsTexture(screen.state.cacheTexInfo.w, screen.state.cacheTexInfo.h); }
        let g = tex.graphics;
        let state = screen.state;
        let font = loadResource("font", "mtrsteamloco:fonts/source-han-sans-bold.otf");
        let { width: w, height: h } = tex;
        let posRateX = w / state.w;
        let posRateY = h / state.h;
        let mx = x * posRateX;
        let my = y * posRateY;
        state.cacheTexInfo = { w, h };

        try {
            let lineHeight = state.lineHeight;

            g.setComposite(AlphaComposite.Clear); // 设置透明混合模式
            g.fillRect(0, 0, w, h); // 填充整个区域
            g.setComposite(AlphaComposite.SrcOver); // 恢复默认混合模式

            let bgImage = loadResource("webimg", "https://image.hokubu.cn/i/2025/06/17/68514902d35f8.png");
            if (bgImage.is_available) g.drawImage(bgImage.get_awt_image(), 0, 0, w, h, null);

            g.setColor(rgbaToColor(0, 0, 0, 60));
            g.fillRect(0, 0, w, h);
            g.setColor(rgbaToColor(0, 0, 0, 30));
            g.fillRect(w * 0.1, lineHeight * 2.5 - h * 0.05, w * 0.8, lineHeight * 11 + h * 0.1);
            g.setColor(Color.WHITE);
            drawStrDL(g, font, font, state.title, w * 0.5, lineHeight * 0.1, lineHeight * 0.7, 1, 1);

            let originalClip = g.getClip();
            g.setClip(new java.awt.Rectangle(0, lineHeight * 1.5, w, lineHeight * 12));
            let nowHeight = lineHeight;
            for (let i = 1; i <= configPageList.length; i++) {
                let item = configPageList[i - 1];
                let param = item.param;
                let thisHeight;
                if (item.type != "str") thisHeight = lineHeight;
                else thisHeight = param.lines * lineHeight;
                let drawY = nowHeight + lineHeight * 1.5 + state.roll;

                let pdbox = { x1: w * 0.125, y1: Math.max(drawY, lineHeight * 1.5), x2: w * 0.875, y2: Math.min(drawY + thisHeight, lineHeight * 13.5) };
                let selected = mx >= pdbox.x1 && mx <= pdbox.x2 && my >= pdbox.y1 && my <= pdbox.y2;

                if (param.showConditition !== true) if (typeof param.showConditition == "function" ? !param.showConditition() : !param.showConditition) continue;

                nowHeight += thisHeight;

                if (drawY + lineHeight < lineHeight * 0.5 || drawY >= lineHeight * 13.5) continue;

                g.setColor(selected ? rgbaToColor(64, 64, 64, 65) : rgbaToColor(64, 64, 64, 35));
                g.fillRect(w * 0.125, drawY + lineHeight * 0.05, w * 0.75, thisHeight - lineHeight * 0.1);
                g.setColor(Color.WHITE);
                g.setFont(font.deriveFont(lineHeight * 0.35));
                // g.drawString(item.text + "  " + JSON.stringify(param) + ((typeof (param.showConditition) == "function") ? param.showConditition + param.showConditition() : "true"), w * 0.15, drawY + lineHeight * 0.7);
                g.drawString(item.text, w * 0.15, drawY + lineHeight * 0.7);

                if (item.type == "str") {
                    g.setColor(rgbaToColor(255, 255, 255, 15));
                    g.fillRect(w * 0.525 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.35, thisHeight - lineHeight * 0.3);
                    g.setStroke(new BasicStroke(h * 0.0025));
                    g.drawRect(w * 0.525 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.35, thisHeight - lineHeight * 0.3);

                    let drawLines = state.eyecandy.state.cacheConfig[param.savePos];
                    if (state.inEditing == i - 1) {
                        if (state.editInfo) {
                            if (state.charTypeInfo) {
                                state.eyecandy.state.cacheConfig[param.savePos] = insertString(state.eyecandy.state.cacheConfig[param.savePos], state.charTypeInfo, state.editInfo.editingChr);
                                state.editInfo.editingChr += String(state.charTypeInfo).length;
                            }
                            if (state.haveBkSp) {
                                state.eyecandy.state.cacheConfig[param.savePos] = removeChar(state.eyecandy.state.cacheConfig[param.savePos], state.editInfo.editingChr - 1);
                                state.editInfo.editingChr--;
                            }
                            if (state.haveArrL) state.editInfo.editingChr--;
                            if (state.haveArrR) state.editInfo.editingChr++;
                            if (state.editInfo.editingChr < 0) state.editInfo.editingChr = 0;
                            if (state.editInfo.editingChr > String(state.eyecandy.state.cacheConfig[param.savePos]).length)
                                state.editInfo.editingChr = String(state.eyecandy.state.cacheConfig[param.savePos]).length;
                            drawLines = insertString(
                                state.eyecandy.state.cacheConfig[param.savePos],
                                state.editInfo.editingChr == String(state.eyecandy.state.cacheConfig[param.savePos]).length ? "_" : "^",
                                state.editInfo.editingChr
                            );
                        } else {
                            state.editInfo = { editingChr: String(state.eyecandy.state.cacheConfig[param.savePos]).length };
                        }
                    }

                    g.setColor(Color.WHITE);
                    let lines = getLineWrap(g, drawLines, font, lineHeight * 0.4, w * 0.35);

                    g.setClip(new java.awt.Rectangle(w * 0.525 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.35, thisHeight - lineHeight * 0.3));

                    for (let i = 0; i < lines.length; i++) {
                        drawStrDL(g, font, font, lines[i], w * 0.7 - lineHeight * 0.1, drawY + (i + 0.5) * lineHeight * 0.5, lineHeight * 0.4, 1, 1);
                    }

                    g.setClip(new java.awt.Rectangle(0, lineHeight * 1.5, w, lineHeight * 12));
                } else if (item.type == "num") {
                    g.setColor(rgbaToColor(255, 255, 255, 15));
                    g.fillRect(w * 0.725 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.15, thisHeight - lineHeight * 0.3);
                    g.setStroke(new BasicStroke(h * 0.0025));
                    g.drawRect(w * 0.725 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.15, thisHeight - lineHeight * 0.3);

                    state.eyecandy.state.cacheConfig[param.savePos] = String(state.eyecandy.state.cacheConfig[param.savePos]);
                    let drawLines = state.eyecandy.state.cacheConfig[param.savePos];
                    if (state.inEditing == i - 1) {
                        if (state.editInfo) {
                            if (state.charTypeInfo) {
                                state.eyecandy.state.cacheConfig[param.savePos] = insertString(state.eyecandy.state.cacheConfig[param.savePos], state.charTypeInfo, state.editInfo.editingChr);
                                state.editInfo.editingChr += String(state.charTypeInfo).length;
                            }
                            // if (state.haveBkSp) {
                            //     if (state.lastBkSp <= Date.now() - 500) {
                            //         state.eyecandy.state.cacheConfig[param.savePos] = removeChar(state.eyecandy.state.cacheConfig[param.savePos], state.editInfo.editingChr - 1); state.editInfo.editingChr--;
                            //         state.lastBkSp = Date.now();
                            //     }
                            // }
                            if (state.haveBkSp) {
                                state.eyecandy.state.cacheConfig[param.savePos] = removeChar(state.eyecandy.state.cacheConfig[param.savePos], state.editInfo.editingChr - 1);
                                state.editInfo.editingChr--;
                            }
                            if (state.haveArrL) state.editInfo.editingChr--;
                            if (state.haveArrR) state.editInfo.editingChr++;
                            if (state.editInfo.editingChr < 0) state.editInfo.editingChr = 0;
                            if (state.editInfo.editingChr > String(state.eyecandy.state.cacheConfig[param.savePos]).length)
                                state.editInfo.editingChr = state.eyecandy.state.cacheConfig[param.savePos].length;
                            drawLines = insertString(
                                state.eyecandy.state.cacheConfig[param.savePos],
                                state.editInfo.editingChr == String(state.eyecandy.state.cacheConfig[param.savePos]).length ? "_" : "^",
                                state.editInfo.editingChr
                            );
                        } else {
                            state.editInfo = { editingChr: String(state.eyecandy.state.cacheConfig[param.savePos]).length };
                        }
                    }

                    g.setColor(Color.WHITE);
                    drawStrDL(g, font, font, drawLines, w * 0.8 - lineHeight * 0.1, drawY + lineHeight * 0.3, lineHeight * 0.4, 1, 1);
                } else if (item.type == "bool") {
                    g.setColor(rgbaToColor(255, 255, 255, 15));
                    g.fillRect(w * 0.725 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.15, thisHeight - lineHeight * 0.3);
                    g.setStroke(new BasicStroke(h * 0.0025));
                    g.drawRect(w * 0.725 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.15, thisHeight - lineHeight * 0.3);

                    g.setColor(Color.WHITE);
                    drawStrDL(g, font, font, state.eyecandy.state.cacheConfig[param.savePos] ? "真" : "假", w * 0.8 - lineHeight * 0.1, drawY + lineHeight * 0.3, lineHeight * 0.4, 1, 1);
                } else if (item.type == "list") {
                    g.setColor(rgbaToColor(255, 255, 255, 15));
                    g.fillRect(w * 0.725 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.15, thisHeight - lineHeight * 0.3);
                    g.setStroke(new BasicStroke(h * 0.0025));
                    g.drawRect(w * 0.725 - lineHeight * 0.1, drawY + lineHeight * 0.15, w * 0.15, thisHeight - lineHeight * 0.3);

                    let selectedItem = param.listItems.length > 0 ? param.listItems[state.eyecandy.state.cacheConfig[param.savePos]] : null;
                    g.setColor(Color.WHITE);
                    drawStrDL(
                        g,
                        font,
                        font,
                        selectedItem ? selectedItem.text : param.listItems + " " + state.eyecandy.state.cacheConfig[param.savePos],
                        w * 0.8 - lineHeight * 0.1,
                        drawY + lineHeight * 0.3,
                        lineHeight * 0.4,
                        1,
                        1
                    );
                }

                if (state.clickInfo && selected) {
                    clearEdit();
                    if (item.type == "str") {
                        state.inEditing = i - 1;
                        // setDebugInfo(state.eyecandy.state.cacheConfig[param.savePos].length);
                        // setDebugInfo(typeof (state.eyecandy.state.cacheConfig[param.savePos]));
                    } else if (item.type == "num") {
                        state.inEditing = i - 1;
                    } else if (item.type == "bool") {
                        state.eyecandy.state.cacheConfig[param.savePos] = !state.eyecandy.state.cacheConfig[param.savePos];
                    } else if (item.type == "list") {
                        state.eyecandy.state.cacheConfig[param.savePos]++;
                        if (state.eyecandy.state.cacheConfig[param.savePos] >= param.listItems.length) state.eyecandy.state.cacheConfig[param.savePos] = 0;
                    } else if (item.type == "function") {
                        try {
                            param.function();
                        } catch (e) {
                            setErrorInfo("@ConfigScreen @Function @" + item.text + " : " + e);
                        }
                    } else if (item.type == "mainModel") {
                        displaySelectionScreen(createSelectionScreen({ type: param.type, save: "mainModel" }, screen, "mainModel", "mainModel", state.eyecandy));
                    } else if (item.type == "subModel") {
                        displaySelectionScreen(createSelectionScreen({ type: param.type, save: item.param.saveKey, path: item.param.path }, screen, "subModel", item.param.saveKey, state.eyecandy));
                    }
                }
            }
            g.setClip(originalClip);

            state.maxHeight = 12 * state.lineHeight - Math.max(nowHeight, 12 * state.lineHeight);

            drawWaterPrint(g, w, h);
        } catch (e) {
            dispErrScreen(e);
        }

        tex.upload();

        screen.state.haveArrL = false;
        screen.state.haveArrR = false;
        // screen.state.haveBkSp = false;
        screen.state.clickInfo = null;
        screen.state.charTypeInfo = null;
    };

    function clearEdit() {
        let state = screen.state;

        if (state.inEditing == -1) {
            return;
        }
        state.editInfo = null;
        let editingItem = state.configPageList[state.inEditing];
        if (editingItem.type == "num") {
            currentNum = parseNumber(String(state.eyecandy.state.cacheConfig[editingItem.param.savePos]));
            if (currentNum > editingItem.param.max) currentNum = editingItem.param.max;
            if (currentNum < editingItem.param.min) currentNum = editingItem.param.min;
            if (editingItem.param.isInt) currentNum = parseInt(currentNum);
            state.eyecandy.state.cacheConfig[editingItem.param.savePos] = currentNum;
        }
        state.inEditing = -1;
    }

    function parseNumber(inputStr) {
        if (typeof inputStr == "number") return inputStr;
        // 处理空字符串
        if (!inputStr || inputStr.trim() == "") return 0;
        inputStr = String(inputStr);

        let normalized = "";
        let hasDecimal = false;
        let hasNegative = false;

        // 允许第一个字符是负号
        if (inputStr[0] == "-") {
            hasNegative = true;
            normalized += "-";
        }

        // 遍历每个字符
        for (let i = hasNegative ? 1 : 0; i < inputStr.length; i++) {
            var char = inputStr[i];

            if (char >= "0" && char <= "9") {
                normalized += char;
            } else if (char === "." && !hasDecimal) {
                // 只允许第一个小数点
                hasDecimal = true;
                normalized += ".";
            }
            // 忽略其他字符
        }

        // 处理特殊情况
        if (normalized === "-" || normalized === "") return 0;
        if (normalized.endsWith(".")) normalized = normalized.slice(0, -1);
        if (normalized.startsWith("-") && normalized.length === 1) return 0;

        // 转换为数字
        var number = parseFloat(normalized);

        // 确保返回有效的数字（处理极端情况如"Infinity"）
        return isFinite(number) ? number : 0;
    }

    screen.onCloseFunction = (screen) => {
        clearEdit();
        let cacheConfig = screen.state.eyecandy.state.cacheConfig;
        let finalConfig = screen.state.eyecandy.state.config;
        if (!finalConfig) finalConfig = {};
        screen.state.configPageList.forEach((element) => {
            let param = element.param;
            let type = element.type;
            if (type == "num") finalConfig[param.savePos] = parseNumber(cacheConfig[param.savePos]);
            if (type == "list") finalConfig[param.savePos] = param.listItems.length > 0 ? param.listItems[cacheConfig[param.savePos]].val : null;
            if (type == "str" || type == "bool") finalConfig[param.savePos] = cacheConfig[param.savePos];
        });
        screen.state.eyecandy.state.config = finalConfig;
        setDebugInfo("Config: " + JSON.stringify(screen.state.eyecandy.state.config));
        // screen.state.eyecandy.state.config = screen.state.eyecandy.state.cacheConfig;
        try {
            // setDebugInfo(screen.state.parent);
            MinecraftClient.setScreen(screen.state.parent);
        } catch (e) {
            MinecraftClient.setScreen(null);
        }
    };

    screen.mouseScrolledFunction = (screen, x, y, val) => {
        let maxHeight = screen.state.maxHeight;
        let posRateY = screen.texture.height / screen.state.h;
        screen.state.roll += val * posRateY * 3;
        if (screen.state.roll <= maxHeight) screen.state.roll = maxHeight;
        if (screen.state.roll > 0) screen.state.roll = 0;
        return true;
    };

    screen.charTypedFunction = (screen, chr, v) => {
        if (screen.state.charTypeInfo) screen.state.charTypeInfo += chr;
        else screen.state.charTypeInfo = chr;
        return true;
    };

    screen.keyPressResponder = (screen, a, b, c) => {
        if (a == 263) screen.state.haveArrL = true;
        if (a == 262) screen.state.haveArrR = true;
        if (a == 341) screen.state.havePressCtrl = true;
        if (a == 259) screen.state.haveBkSp = true;
        if (a == 86 && screen.state.havePressCtrl) screen.state.charTypeInfo = getClipboard();
        if (a == 86 && screen.state.havePressCtrl) setDebugInfo("get clipboard " + getClipboard());
        return false;
    };

    screen.keyReleasedFunction = (screen, a, b, c) => {
        if (a == 263) screen.state.haveArrL = false;
        if (a == 262) screen.state.haveArrR = false;
        if (a == 341) screen.state.havePressCtrl = false;
        if (a == 259) screen.state.haveBkSp = false;

        return false;
    };

    screen.mouseReleasedFunction = (screen, x, y, i) => {
        if (screen.state.skipFirstClick) {
            screen.state.skipFirstClick = false;
            return true;
        }
        let tex = screen.texture;
        let { width: w, height: h } = tex;
        let state = screen.state;
        let mx = (w / state.w) * x;
        let my = (h / state.h) * y;
        screen.state.clickInfo = { x: mx, y: my };
        return true;
    };

    MinecraftClient.setScreen(screen);
}

function checkCacheConfig(state, key, val) {
    return state.cacheConfig[key] == val;
}
