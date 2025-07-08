importPackage(java.awt);
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));

var resSc = {};
function createConfigScreen(configItemList, parent, eyecandy) {
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
        state.roll = 0;
        state.maxHeight = 12 * state.lineHeight - Math.max(configItemList.length * state.lineHeight, 12 * state.lineHeight);
        state.bg = loadRes(resSc, "image", "mtrsteamloco:cfg/bg.png");
        state.parent = parent;
        state.inEditing = -1;
    };
    screen.state.skipFirstClick = true;
    return screen;
}

function displayConfigScreen(screen) {
    let configPageList = screen.state.configPageList;
    let currentPage = screen.state.currentPage;
    screen.renderFunction = (screen, x, y, d) => {
        let tex = screen.texture;
        let g = tex.graphics;
        let state = screen.state;
        let font = loadRes(resSc, "font", "mtrsteamloco:fonts/ys.ttf");
        let { width: w, height: h } = tex;
        let posRateX = w / state.w;
        let posRateY = h / state.h;
        let mx = x * posRateX;
        let my = y * posRateY;

        try {
            let lineHeight = state.lineHeight;

            g.setComposite(AlphaComposite.Clear); // 设置透明混合模式
            g.fillRect(0, 0, w, h); // 填充整个区域
            g.setComposite(AlphaComposite.SrcOver); // 恢复默认混合模式

            //g.drawImage(state.bg, 0, 0, w, h, null);
            // g.setColor(new Color(1, 1, 1, 0.2)); // 60/255透明度
            // g.fillRect(0, 0, 512, 256);
            //g.setColor(rgbaToColor(200, 200, 200, 0.5));
            //g.fillRect(0, 0, w, h);

            //g.setColor(Color.BLUE);
            //g.fillRect(0, 0, w, h);
            g.setFont(font.deriveFont(lineHeight * 0.8));
            g.setColor(Color.WHITE);
            //title
            g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.title")), w * 0.1, lineHeight * 0.9);
            g.setFont(font.deriveFont(lineHeight * 0.6));
            // for (let i = 1; i <= dispPage.items.length; i++) {
            //     let drawY = (0.5 + i) * lineHeight;
            //     g.setColor(rgbToColor(215, 211, 200));
            //     g.fillRoundRect(w * 0.025, drawY + lineHeight * 0.05, w * 0.95, lineHeight * 0.9, lineHeight, lineHeight);
            //     g.setColor(Color.BLACK);
            //     let drawText;
            //     if (dispPage.items[i - 1].type == "str") {
            //         drawText = "[" + dispPage.items[i - 1].text + "]";
            //     }
            //     if (dispPage.items[i - 1].type == "bool") {
            //         drawText = "[ " + (dispPage.items[i - 1].val ? "T " : "F ") + dispPage.items[i - 1].text + "]";
            //     }
            //     if (dispPage.items[i - 1].type == "list") {
            //         drawText = "[" + dispPage.items[i - 1].text + "] >>>";
            //     }
            //     if (dispPage.items[i - 1].type == "function") {
            //         drawText = "[" + dispPage.items[i - 1].text + "]";
            //     }

            //     // if (posRateY * y < drawY + lineHeight && posRateY * y >= drawY) {
            //     //     //g.setFont(font.deriveFont(Font.BOLD, lineHeight * 0.8));
            //     //     // g.setColor(Color.RED);
            //     //     // g.fillRect(0, drawY, w, lineHeight);
            //     //     // g.setColor(Color.WHITE);
            //     //     g.setColor(Color.WHITE);
            //     // } else {
            //     //     //g.setFont(font.deriveFont(lineHeight * 0.8));
            //     //     g.setColor(Color.LIGHT_GRAY);
            //     // }
            //     g.drawString(drawText, w * 0.025, drawY + lineHeight * 0.9);
            // }
            let originalClip = g.getClip();
            g.setClip(new java.awt.Rectangle(0, lineHeight * 1.5, w, lineHeight * 12));
            for (let i = 1; i <= configPageList.length; i++) {
                let item = configPageList[i - 1];
                let drawY = lineHeight * i + lineHeight * 1.5 + state.roll;
                let pdbox = { x1: w * 0.05, y1: Math.max(drawY, lineHeight * 1.5), x2: w * 0.95, y2: Math.min(drawY + lineHeight, lineHeight * 13.5) };
                let selected = mx >= pdbox.x1 && mx <= pdbox.x2 && my >= pdbox.y1 && my <= pdbox.y2;
                if (drawY + lineHeight < lineHeight * 1.5 || drawY > lineHeight * 13.5) continue;
                if (selected) {
                    g.setColor(Color.WHITE);
                    g.fillRoundRect(w * 0.025 - w * 0.001, drawY + lineHeight * 0.05 - w * 0.001, w * 0.95 + w * 0.002, lineHeight * 0.9 + w * 0.002, lineHeight, lineHeight);
                }
                g.setColor(selected ? rgbToColor(237, 229, 215) : rgbToColor(207, 204, 193));
                g.fillRoundRect(w * 0.025, drawY + lineHeight * 0.05, w * 0.95, lineHeight * 0.9, lineHeight, lineHeight);
                g.setColor(selected ? rgbToColor(100, 100, 100) : rgbToColor(58, 57, 65));
                if (item.type != "str") g.fillRoundRect(w * 0.775, drawY + lineHeight * 0.05, w * 0.2, lineHeight * 0.9, lineHeight, lineHeight);
                else g.fillRoundRect(w * 0.5, drawY + lineHeight * 0.05, w * 0.475, lineHeight * 0.9, lineHeight, lineHeight);
                //g.drawImage(img1, w * 0.1, drawY + lineHeight * 0.075, w * 0.1, lineHeight * 0.85, null);
                g.setColor(rgbToColor(77, 83, 100));
                let drawText = item.text;
                let buttonText = "";
                if (item.type == "num") {
                    buttonText = item.val.val;
                    if (i == state.inEditing) buttonText += Timing.elapsed() % 2 < 1 ? "_" : " ";
                    if (i == state.inEditing) drawText += item.val.val;
                } else if (item.type == "str") {
                    buttonText = item.val.val;
                    if (i == state.inEditing) buttonText += Timing.elapsed() % 2 < 1 ? "_" : " ";
                } else if (item.type == "bool") {
                    buttonText = ComponentUtil.getString(ComponentUtil.translatable("cfg.bool.s" + String(item.val.style) + "." + (item.val.val ? "t" : "f")));
                } else if (item.type == "list") {
                    buttonText = item.val.list[item.val.val].text;
                } else if (item.type == "function") {
                    drawText = item.text;
                    buttonText = ComponentUtil.getString(ComponentUtil.translatable("cfg.content.go"));
                } else if (item.type == "mainModel" || item.type == "subModel") {
                    buttonText = ComponentUtil.getString(ComponentUtil.translatable("cfg.content.go"));
                }
                g.drawString(drawText, w * 0.05, drawY + lineHeight * 0.5 + g.getFontMetrics(font.deriveFont(lineHeight * 0.6)).getHeight() * 0.5);
                g.setColor(selected ? rgbToColor(155, 155, 155) : rgbToColor(207, 204, 193));
                if (item.type != "str")
                    g.drawString(
                        buttonText,
                        w * 0.875 - 0.5 * g.getFontMetrics(font.deriveFont(lineHeight * 0.6)).stringWidth(buttonText),
                        drawY + lineHeight * 0.5 + g.getFontMetrics(font.deriveFont(lineHeight * 0.6)).getHeight() * 0.5
                    );
                else
                    g.drawString(
                        buttonText,
                        w * 0.7375 - 0.5 * g.getFontMetrics(font.deriveFont(lineHeight * 0.6)).stringWidth(buttonText),
                        drawY + lineHeight * 0.5 + g.getFontMetrics(font.deriveFont(lineHeight * 0.6)).getHeight() * 0.5
                    );

                if (state.clickInfo)
                    if (state.clickInfo.x >= pdbox.x1 && state.clickInfo.x <= pdbox.x2 && state.clickInfo.y >= pdbox.y1 && state.clickInfo.y <= pdbox.y2) {
                        if (item.type == "num") {
                            if (state.inEditing != -1)
                                if (state.inEditing != i) {
                                    // configPageList[state.inEditing - 1].val.val += state.cacheChr;
                                    state.cacheChr = "";
                                }
                            state.inEditing = i;
                        } else if (item.type == "str") {
                            if (state.inEditing != -1)
                                if (state.inEditing != i) {
                                    // configPageList[state.inEditing - 1].val.val += state.cacheChr;
                                    state.cacheChr = "";
                                }
                            state.inEditing = i;
                        } else if (item.type == "bool") {
                            item.val.val = !item.val.val;
                            state.eyecandy.state[item.val.save] = item.val.val;
                        } else if (item.type == "list") {
                            item.val.val++;
                            if (item.val.val >= item.val.list.length) item.val.val = 0;
                            state.eyecandy.state[item.val.save] = item.val.val;
                        } else if (item.type == "function") {
                            eval(item.val);
                        } else if (item.type == "mainModel") {
                            displaySelectionScreen(createSelectionScreen(item.val, screen, "mainModel", "mainModel", state.eyecandy));
                        } else if (item.type == "subModel" || item.val.type == "subModel") {
                            displaySelectionScreen(createSelectionScreen(item.val, screen, "subModel", item.val.saveKey ? item.val.saveKey : "subModel", state.eyecandy));
                        }

                        state.clickInfo = null;
                    } else {
                        clearEdit();
                    }

                if (state.inEditing == i) {
                    if (state.cacheChr == "|") item.val.val = "";

                    let targetVal = item.val; // {val, isInt, max?, min?}
                    let current = targetVal.val.toString();

                    if (state.haveBkSp) {
                        current = current.slice(0, -1);
                        state.haveBkSp = false;
                    }

                    if (item.type == "num") {
                        // 预处理：整数模式强制清理现有小数点
                        if (targetVal.isInt && current.includes(".")) {
                            current = current.split(".")[0] || "0";
                        }
                        // 逐字符处理缓存输入
                        if (state.cacheChr)
                            for (let char of state.cacheChr) {
                                if (/\d/.test(char)) {
                                    // 数字直接追加
                                    current += char;
                                } else if (char === "." && !targetVal.isInt) {
                                    // 小数模式处理
                                    if (!current.includes(".")) {
                                        // 仅允许第一个小数点
                                        current += char;
                                    }
                                }
                            }
                        // 后处理验证
                        current = String(current)
                            .replace(/^\./, "0.") // 前导. → 0.
                            .replace(/\.$/, "") // 尾部.自动去除
                            .replace(/^0+(?=\d)/, ""); // 清除前导零（保留最后一个零）
                        if (current === "" || current === ".") current = "0";

                        // 强制整数模式处理
                        if (targetVal.isInt) {
                            current = current.split(".")[0] || "0"; // 去除小数部分
                            if (current === "") current = "0";
                        }
                        // 数值范围约束（可选扩展点）
                    }
                    if (item.type == "str") {
                        if (state.cacheChr)
                            for (let char of state.cacheChr) {
                                current += char;
                            }
                    }

                    item.val.val = current; // 更新目标值
                    state.eyecandy.state[item.val.save] = item.val.val;

                    state.cacheChr = ""; // 清空当前缓存
                }
            }
            g.setClip(originalClip);

            //g.setColor(Color.RED);
            //g.fillRect(posRateX * x - 10, posRateY * y - 10, 20, 20);
            //g.drawString("Roll: " + String(state.roll) + "/" + String(state.maxHeight), 50, 50);

            drawWaterPrint(g, w, h);
        } catch (e) {
            dispErrScreen(e);
        }
        tex.upload();
    };

    function clearEdit() {
        let state = screen.state;

        if (state.inEditing == -1) {
            return;
        }

        configPageList[state.inEditing - 1].val.val += state.cacheChr;
        state.cacheChr = "";

        let targetVal = configPageList[state.inEditing - 1].val;

        if (configPageList[state.inEditing - 1].type == "num") {
            if (targetVal.max) {
                let numVal = parseFloat(targetVal.val);
                if (numVal > targetVal.max) targetVal.val = targetVal.max;
            }
            if (targetVal.min) {
                let numVal = parseFloat(targetVal.val);
                if (numVal < targetVal.min) targetVal.val = targetVal.min;
            }
        }
        state.eyecandy.state[targetVal.save] = targetVal.val;
        state.inEditing = -1;
    }

    screen.onCloseFunction = (screen) => {
        clearEdit();
        try {
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
        print("[DEBUG} chr ", chr);
        print("[DEBUG] v ", v);
        screen.state.cacheChr += chr;
        return true;
    };

    screen.keyReleasedFunction = (screen, a, b, c) => {
        print("[DEBUG] a ", a);
        print("[DEBUG] b ", b);
        print("[DEBUG] c ", c);
        if (a == 259) screen.state.haveBkSp = true;
        return true;
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

function createSelectionScreen(itemval, parent, modelType, saveKey, eyecandy) {
    let type = itemval.type;
    print(saveKey);
    let screen = new IScreen.WithTextrue(ComponentUtil.literal("selectionScreen"));
    let configs = [];
    if (modelType == "mainModel") {
        let md = loadRes(resSc, "json", "fangsu:custom_blocks.json")[type];
        //print(type);
        //print(loadRes(resSc, "str", "fangsu:custom_blocks.json"));
        for (let m of md) {
            configs.push({
                text: m.text,
                type: "function",
                val: {
                    content: m.content || "?",
                    contentText: m.contentText || "",
                    contentImage: m.contentImage || null
                }
            });
        }
        screen.state.configPageList = configs;
        //print(configs);
    } else if (modelType == "subModel") {
        if (eyecandy.block.getCustomConfig("mainModel")) {
            let md = getByPath(JSON.parse(loadRes(resSc, "str", eyecandy.block.getCustomConfig("mainModel"))), itemval.path);
            //print(JSON.stringify(md));
            if (md)
                for (let m of md) {
                    configs.push({
                        text: m.text,
                        type: "function",
                        val: {
                            content: m.id,
                            contentText: m.contentText || "",
                            contentImage: m.contentImage || null
                        }
                    });
                }
        }
        screen.state.configPageList = configs;
        // print(eyecandy.block.getCustomConfig("mainModel"));
        // print(configs);
    }
    if (!screen.state.currentPage) screen.state.currentPage = 0;
    screen.initFunction = (screen, w, h) => {
        let state = screen.state;
        let tex = screen.texture;
        let th = tex.height;
        state.defaultVal = itemval.defaultVal;
        state.eyecandy = eyecandy;
        state.lineHeight = th / 8;
        state.w = w;
        state.h = h;
        state.roll = 0;
        state.maxHeight = 6 * state.lineHeight - Math.max(configs.length * state.lineHeight, 6 * state.lineHeight);
        state.bg = loadRes(resSc, "image", "mtrsteamloco:cfg/ys2.png");
        state.parent = parent;
        state.type = modelType;
        state.saveKey = saveKey;
        state.selected = -1;
        state.content = {};
        for (i = 0; i < state.configPageList.length; i++) {
            if (state.defaultVal == state.configPageList[i].val.content) state.selected = i + 1;
            // print(state.defaultVal, " | ", state.configPageList[i].val.content)
        }
    };
    screen.onCloseFunction = (screen) => {
        try {
            MinecraftClient.setScreen(screen.state.parent);
        } catch (e) {
            MinecraftClient.setScreen(null);
        }
    };
    return screen;
}

function displaySelectionScreen(screen) {
    let configPageList = screen.state.configPageList;
    screen.renderFunction = (screen, x, y, d) => {
        let tex = screen.texture;
        let g = tex.graphics;
        let state = screen.state;
        let font = loadRes(resSc, "font", "mtrsteamloco:fonts/ys.ttf");
        let { width: w, height: h } = tex;
        let posRateX = w / state.w;
        let posRateY = h / state.h;
        let mx = x * posRateX;
        let my = y * posRateY;

        try {
            let lineHeight = state.lineHeight;

            g.setComposite(AlphaComposite.Clear); // 设置透明混合模式
            g.fillRect(0, 0, w, h); // 填充整个区域
            g.setComposite(AlphaComposite.SrcOver); // 恢复默认混合模式

            g.drawImage(state.bg, 0, 0, w, h, null);

            //g.setColor(Color.BLUE);
            //g.fillRect(0, 0, w, h);
            g.setFont(font.deriveFont(lineHeight * 0.4));
            g.setColor(Color.WHITE);
            //title
            g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.title")), w * 0.1, lineHeight * 0.45);
            g.setFont(font.deriveFont(lineHeight * 0.3));

            let originalClip = g.getClip();
            g.setClip(new java.awt.Rectangle(0, lineHeight * 0.75, w * 0.3, lineHeight * 6.75));
            if (configPageList.length > 0)
                for (let i = 1; i <= configPageList.length; i++) {
                    let item = configPageList[i - 1];
                    let drawY = lineHeight * i - lineHeight * 0.25 + state.roll;
                    let pdbox = { x1: w * 0.05, y1: Math.max(drawY, lineHeight * 0.75), x2: w * 0.3, y2: Math.min(drawY + lineHeight, lineHeight * 7.5) };
                    if (drawY + lineHeight < lineHeight * 0.75 || drawY > lineHeight * 7.5) continue;
                    if (state.selected == i) {
                        g.setColor(rgbToColor(207, 204, 193));
                        g.fillRect(w * 0.05, drawY + lineHeight * 0.05, w * 0.25, lineHeight * 0.9);
                        g.setColor(rgbToColor(0, 0, 0));
                    } else {
                        let selected = mx >= pdbox.x1 && mx <= pdbox.x2 && my >= pdbox.y1 && my <= pdbox.y2;

                        if (selected) {
                            g.setColor(rgbaToColor(255, 255, 255, 0.2));
                            g.fillRect(w * 0.05 - w * 0.001, drawY + lineHeight * 0.05 - w * 0.001, w * 0.25 + w * 0.002, lineHeight * 0.9 + w * 0.002);
                        }
                        g.setColor(selected ? rgbaToColor(200, 200, 200, 0.5) : rgbaToColor(43, 53, 71, 0.5));
                        g.fillRect(w * 0.05, drawY + lineHeight * 0.05, w * 0.25, lineHeight * 0.9);
                        g.setColor(selected ? rgbToColor(155, 155, 155) : rgbToColor(207, 204, 193));
                    }
                    //g.drawImage(img1, w * 0.1, drawY + lineHeight * 0.075, w * 0.1, lineHeight * 0.85, null);

                    let drawText = ComponentUtil.getString(ComponentUtil.translatable(item.text));

                    g.drawString(drawText, w * 0.05, drawY + lineHeight * 0.25 + g.getFontMetrics(font.deriveFont(lineHeight * 0.6)).getHeight() * 0.5);

                    if (state.clickInfo)
                        if (state.clickInfo.x >= pdbox.x1 && state.clickInfo.x <= pdbox.x2 && state.clickInfo.y >= pdbox.y1 && state.clickInfo.y <= pdbox.y2) {
                            // state.eyecandy.block.putCustomConfig(String(state.saveKey), String(item.val.content));
                            // state.eyecandy.block.sendUpdateC2S();
                            // state.eyecandy.ctx.setDebugInfo(state.saveKey, item.val.content);
                            // MinecraftClient.displayMessage(state.saveKey, false);
                            // MinecraftClient.displayMessage(item.val.content, false);
                            state.selected = i;
                            state.contentScoll = 0;
                            state.clickInfo = null;
                        }
                }
            else {
                state.selected = -1;
                g.setClip(originalClip);
                g.setColor(rgbaToColor(0, 0, 0, 70));
                g.fillRect(0, 0, w, h);
                g.setColor(Color.WHITE);
                g.setFont(Resources.getSystemFont("SansSerif").deriveFont(h * 0.1));
                g.drawString("没有可用选项 No available options", 0, h * 0.5);
            }
            g.setClip(originalClip);
            if (state.selected != -1) {
                let contentFont = font.deriveFont(lineHeight * 0.25);
                let item = configPageList[state.selected - 1];
                if (state.content.cache != state.selected) {
                    state.contentScoll = 0;
                    let lines = [];

                    let currentLine = "";

                    for (let char of ComponentUtil.getString(ComponentUtil.translatable(item.val.contentText))) {
                        if (char == "\n") {
                            lines.push(currentLine);
                            currentLine = "";
                            continue;
                        }
                        let testLine = currentLine + char;
                        let testWidth = g.getFontMetrics(contentFont).stringWidth(testLine);
                        if (testWidth <= w * 0.55) {
                            currentLine = testLine;
                        } else {
                            lines.push(currentLine);
                            currentLine = char;
                        }
                    }
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    state.content = { cache: state.selected, text: lines };
                    if (item.val.contentImage)
                        state.contentHeight =
                            ((w * 0.55) / item.val.contentImage.width) * item.val.contentImage.height + lineHeight * 0.25 + g.getFontMetrics(contentFont).getHeight() * (state.content.text.length + 1);
                    else state.contentHeight = g.getFontMetrics(contentFont).getHeight() * (state.content.text.length + 1);
                    screen.state.contentMaxHeight = screen.state.lineHeight * 5.5 - Math.max(screen.state.lineHeight * 5.5, screen.state.contentHeight);
                }
                g.setClip(new java.awt.Rectangle(w * 0.35, lineHeight * 0.75, w * 0.6, lineHeight * 5.5));
                g.setColor(rgbaToColor(43, 53, 71, 0.5));
                g.fillRect(w * 0.35, lineHeight * 0.75, w * 0.6, lineHeight * 5.5);
                let textBeginY = lineHeight;
                if (item.val.contentImage) {
                    textBeginY += ((w * 0.55) / item.val.contentImage.width) * item.val.contentImage.height;
                    g.drawImage(
                        loadRes(resSc, "image", item.val.contentImage.img),
                        w * 0.375,
                        lineHeight * 0.8 + state.contentScoll,
                        w * 0.55,
                        ((w * 0.55) / item.val.contentImage.width) * item.val.contentImage.height,
                        null
                    );
                    //state.contentHeight = w / item.val.contentImage.width * item.val.contentImage.height + lineHeight * 0.25 + g.getFontMetrics(contentFont).getHeight() * state.content.text.length;
                }
                g.setFont(contentFont);
                g.setColor(rgbToColor(207, 204, 193));
                let contentText = state.content.text;
                for (let i = 0; i < contentText.length; i++) {
                    let tx = contentText[i];
                    let dy = textBeginY + state.contentScoll + 1.1 * g.getFontMetrics(contentFont).getHeight() * (i + 1);
                    if (dy > h) continue;
                    g.drawString(tx, w * 0.4, dy);
                }

                g.setClip(originalClip);
                let confirmSelected = mx >= w * 0.35 && mx <= w * 0.95 && my >= lineHeight * 6.8 && my <= lineHeight * 7.5;
                g.setColor(confirmSelected ? rgbToColor(237, 229, 215) : rgbToColor(207, 204, 193));
                g.fillRoundRect(w * 0.35, lineHeight * 6.8, w * 0.6, lineHeight * 0.7, lineHeight * 0.7, lineHeight * 0.7);
                g.setColor(rgbToColor(77, 83, 100));
                g.setFont(font.deriveFont(lineHeight * 0.45));
                let confirmStr = ComponentUtil.getString(ComponentUtil.translatable("cfg.confirm"));
                g.drawString(confirmStr, w * 0.65 - 0.5 * g.getFontMetrics(font.deriveFont(lineHeight * 0.45)).stringWidth(confirmStr), lineHeight * 7.35);

                if (state.clickInfo)
                    if (
                        state.clickInfo.x >= w * 0.35 &&
                        state.clickInfo.x <= w * 0.95 &&
                        state.clickInfo.y >= lineHeight * 6.8 &&
                        state.clickInfo.y <= lineHeight * 7.5 &&
                        y * posRateY < screen.state.lineHeight * 6.25
                    ) {
                        state.eyecandy.block.putCustomConfig(String(state.saveKey), String(item.val.content));
                        state.eyecandy.block.sendUpdateC2S();
                        state.eyecandy.ctx.setDebugInfo(state.saveKey, item.val.content);
                        MinecraftClient.displayMessage(state.saveKey, false);
                        MinecraftClient.displayMessage(item.val.content, false);

                        try {
                            MinecraftClient.setScreen(screen.state.parent);
                        } catch (e) {
                            MinecraftClient.setScreen(null);
                        }
                    }
            }

            //临时加的, 往文档的链接
            {
                let pdbox = { x1: w * 0.125, y1: h * 0.95, x2: w * 0.875, y2: h * 0.99 };
                let selected = mx >= pdbox.x1 && mx <= pdbox.x2 && my >= pdbox.y1 && my <= pdbox.y2;
                g.setColor(selected ? rgbaToColor(64, 64, 64, 60) : rgbaToColor(64, 64, 64, 80));
                g.fillRect(w * 0.125, h * 0.95, w * 0.75, h * 0.04);
                g.setColor(Color.WHITE);
                g.setFont(loadResource("font", "mtrsteamloco:fonts/source-han-sans-bold.otf").deriveFont(h * 0.03));
                g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.respack")), w * 0.15, h * 0.985);
                if (state.clickInfo && selected) {
                    if (
                        state.clickInfo.x >= w * 0.125 &&
                        state.clickInfo.x <= w * 0.875 &&
                        state.clickInfo.y >= h * 0.95 &&
                        state.clickInfo.y <= h * 0.99 &&
                        y * posRateY < screen.state.lineHeight * 6.25
                    ) {
                        openUri("https://doc.fangsu.top");
                        state.clickInfo = null;
                    }
                }
            }

            // g.setColor(Color.RED);
            // //g.fillRect(posRateX * x - 10, posRateY * y - 10, 20, 20);
            // g.drawString("Roll: " + String(state.roll) + "/" + String(state.maxHeight), 50, 50);
            // g.drawString("Roll: " + String(state.contentScoll) + "/" + String(screen.state.lineHeight * 5.5 - Math.max(screen.state.lineHeight * 5.5, screen.state.contentHeight)), 500, 50);
        } catch (e) {
            dispErrScreen(e);
        }
        tex.upload();
    };

    screen.mouseScrolledFunction = (screen, x, y, val) => {
        let contentMaxHeight = screen.state.contentMaxHeight;
        let maxHeight = screen.state.maxHeight;
        let posRateX = screen.texture.width / screen.state.w;
        let posRateY = screen.texture.height / screen.state.h;
        if (x * posRateX < screen.texture.width * 0.3) {
            screen.state.roll += val * posRateY * 7;
            if (screen.state.roll <= maxHeight) screen.state.roll = maxHeight;
            if (screen.state.roll > 0) screen.state.roll = 0;
        } else if (x * posRateX > screen.texture.width * 0.35 && x * posRateX < screen.texture.width * 0.95 && y * posRateY > screen.state.lineHeight * 0.75) {
            screen.state.contentScoll += val * posRateY * 6;
            if (screen.state.contentScoll <= contentMaxHeight) screen.state.contentScoll = contentMaxHeight;
            if (screen.state.contentScoll > 0) screen.state.contentScoll = 0;
        }
        return true;
    };

    screen.mouseReleasedFunction = (screen, x, y, i) => {
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

// function createConfigPage(configItemList, maxPageItem) {
//     MinecraftClient.displayMessage("Creating Config item...", false);
//     let page = [];
//     let currentPage = [];
//     for (let configItem of configItemList) {
//         MinecraftClient.displayMessage(JSON.stringify(configItem), false);
//         currentPage.push(configItem);
//         if (currentPage.length >= maxPageItem) {
//             page.push({ items: currentPage, page: page.length + 1 });
//             currentPage = [];
//         }
//     }
//     if (currentPage.length > 0) page.push({ items: currentPage, page: page.length + 1 });
//     return page;
// }

function dispErrScreen(Err) {
    let errScreen = new IScreen.WithTextrue(ComponentUtil.literal("errScreen"));
    errScreen.initFunction = (screen, w, h) => {
        let state = screen.state;
        state.w = w;
        state.h = h;
    };
    errScreen.renderFunction = (screen, mx, my, d) => {
        let tex = screen.texture;
        let g = tex.graphics;
        let state = screen.state;

        let { width: w, height: h } = tex;

        let errorFont = Resources.getSystemFont("Serif");
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, w, h);
        g.setColor(Color.WHITE);
        g.setFont(errorFont.deriveFont(h * 0.2));
        g.drawString(":(", w * 0.15, h * 0.3);
        g.setFont(errorFont.deriveFont(h * 0.05));
        g.drawString("你的游戏出现了问题, 可能是自定义资源包的问题", w * 0.15, h * 0.4);
        g.drawString("请先恢复自定义配置, 如果仍旧错误可以寻求他人帮助", w * 0.15, h * 0.5);

        let currentLine = "";
        let txL = [];
        let ft = errorFont.deriveFont(h * 0.03);
        for (let char of String(Err)) {
            let testLine = currentLine + char;
            let testWidth = g.getFontMetrics(ft).stringWidth(testLine);
            if (testWidth <= w * 0.55) {
                currentLine = testLine;
            } else {
                txL.push(currentLine);
                currentLine = char;
            }
        }
        if (currentLine) txL.push(currentLine);
        let drawY = h * 0.7;
        g.setFont(ft);
        for (let tx of txL) {
            g.drawString(tx, w * 0.35, drawY);
            drawY += h * 0.035;
        }
        g.drawString("At: " + Err.fileName + ":" + Err.lineNumber, w * 0.35, drawY);
        drawY += h * 0.035;
        g.drawString("请求帮助时, 请不要只发送这个窗口的截图", w * 0.35, drawY);

        drawWaterPrint(g, w, h);
        tex.upload();
    };
    MinecraftClient.setScreen(errScreen);
}

/**
 * 构建配置项
 * @param {String} text 显示文本
 * @param {String} type 类别 (str, bool, list, function, mainModel, subModel)
 * @param {*} defValue 默认值
 * @returns {Object} 一个配置项
 */
function buildCfgItem(text, type, defValue) {
    return { text, type, val: defValue };
}

//configItem:
//{text, type(str, bool, list, function, mainModel, subModel), val}

//configPage:
//[{items: [configItem], page}]
