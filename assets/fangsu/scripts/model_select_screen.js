importPackage(java.awt);
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));
include(Resources.id("fangsu:scripts/text_util.js"));

function createSelectionScreen(itemval, parent, modelType, saveKey, eyecandy) {
    let type = itemval.type;

    let screen = new IScreen.WithTextrue(ComponentUtil.literal("selectionScreen"));
    let configs = [];
    if (modelType == "mainModel") {
        let md = loadResource("json", "fangsu:custom_blocks.json")[type];
        for (let m of md) {
            configs.push({
                text: ComponentUtil.getString(ComponentUtil.translatable(m.text)),
                type: "function",
                val: {
                    content: m.content || "?",
                    contentText: m.contentText ? ComponentUtil.getString(ComponentUtil.translatable(m.contentText)) : ComponentUtil.getString(ComponentUtil.translatable("cfg.no_detail")),
                    contentImage: m.contentImage || null,
                    default: m.default || null
                }
            });
        }
        screen.state.configPageList = configs;
    } else if (modelType == "subModel") {
        if (eyecandy.block.getCustomConfig("mainModel")) {
            let md = getByPath(JSON.parse(loadResource("str", eyecandy.block.getCustomConfig("mainModel"))), itemval.path);
            //print(JSON.stringify(md));
            if (md)
                for (let m of md) {
                    configs.push({
                        text: ComponentUtil.getString(ComponentUtil.translatable(m.text)),
                        type: "function",
                        val: {
                            content: m.id,
                            contentText: m.contentText ? ComponentUtil.getString(ComponentUtil.translatable(m.contentText)) : ComponentUtil.getString(ComponentUtil.translatable("cfg.no_detail")),
                            contentImage: m.contentImage || null
                        }
                    });
                }
        }
        screen.state.configPageList = configs;
    } else if (modelType == "file") {
        let md = loadResource("json", itemval.path)[type];
        for (let m of md) {
            configs.push({
                text: ComponentUtil.getString(ComponentUtil.translatable(m.text)),
                type: "function",
                val: {
                    content: m.content || "?",
                    contentText: m.contentText ? ComponentUtil.getString(ComponentUtil.translatable(m.contentText)) : ComponentUtil.getString(ComponentUtil.translatable("cfg.no_detail")),
                    contentImage: m.contentImage || null
                }
            });
        }
        screen.state.configPageList = configs;
    } else {
        let configs = [];
        if (itemval.itemList) configs = itemval.itemList;
        screen.state.configPageList = configs;
    }
    if (!screen.state.currentPage) screen.state.currentPage = 0;
    screen.initFunction = (screen, w, h) => {
        let state = screen.state;
        let tex = screen.texture;
        let th = tex.height;
        state.defaultVal = itemval.defaultVal;
        state.eyecandy = eyecandy;
        state.w = w;
        state.h = h;
        state.roll = 0;
        state.maxHeight = 6 * state.lineHeight - Math.max(configs.length * state.lineHeight, 6 * state.lineHeight);
        state.bg = loadResource("image", "mtrsteamloco:cfg/ys2.png");
        state.parent = parent;
        state.type = modelType;
        state.saveKey = saveKey;
        state.selected = -1;
        state.content = {};
        for (i = 0; i < state.configPageList.length; i++) {
            if (state.defaultVal == state.configPageList[i].val.content) state.selected = i + 1;
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
        let font = loadResource("font", "mtrsteamloco:fonts/misans-bold.otf");
        let { width: w, height: h } = tex;
        let posRateX = w / state.w;
        let posRateY = h / state.h;
        let mx = x * posRateX;
        let my = y * posRateY;

        try {
            let lineHeight = h * 0.075;

            g.setComposite(AlphaComposite.Clear); // 设置透明混合模式
            g.fillRect(0, 0, w, h); // 填充整个区域
            g.setComposite(AlphaComposite.SrcOver); // 恢复默认混合模式

            let bgImage = loadResource("img", "mtrsteamloco:cfg/ys2.png");
            g.drawImage(bgImage, 0, 0, w, h, null);

            g.setColor(rgbaToColor(0, 0, 0, 60));
            g.fillRect(0, 0, w, h);
            g.setColor(rgbaToColor(0, 0, 0, 30));
            g.fillRect(w * 0.09, h * 0.15, w * 0.82, h * 0.75);
            g.setColor(Color.WHITE);
            drawStrUnified(g, font, ComponentUtil.getString(ComponentUtil.translatable("cfg.title")), w * 0.5, lineHeight * 1.1, lineHeight * 0.7, 1, 1);

            let originalClip = g.getClip();
            g.setClip(new Rectangle(w * 0.1, h * 0.15, w * 0.8, h * 0.75));

            if (configPageList.length > 0) {
                let totalHeight = 0;

                for (let i = 0; i < configPageList.length; i++) {
                    let thisConfig = configPageList[i];
                    let thisText = TextUtil.isCjk(thisConfig.text) ? getCjkLineWrap(g, thisConfig.text, font, h * 0.035, w * 0.2) : getNoncjkLineWrap(g, thisConfig.text, font, h * 0.035, w * 0.2);
                    let thisHeight = thisText.length * h * 0.06 + h * 0.025;
                    let nowHeight = state.roll + totalHeight;
                    let currentY = nowHeight + h * 0.0125 + h * 0.15;
                    let pdbox = { x1: w * 0.1, y1: Math.max(currentY, h * 0.15), x2: w * 0.3, y2: Math.min(currentY + thisHeight, h * 0.8) };
                    let selected = mx >= pdbox.x1 && mx <= pdbox.x2 && my >= pdbox.y1 && my <= pdbox.y2;

                    g.setColor(state.selected == i ? rgbaToColor(255, 255, 255, 65) : selected ? rgbaToColor(64, 64, 64, 65) : rgbaToColor(64, 64, 64, 35));
                    g.fillRect(w * 0.1, currentY, w * 0.2, thisHeight);
                    g.setColor(state.selected == i ? Color.BLACK : Color.WHITE);
                    for (let j = 0; j < thisText.length; j++) {
                        let thisY = currentY + (j + 1) * h * 0.06;
                        drawStrUnified(g, font, thisText[j], w * 0.2, thisY, h * 0.03, 1);
                    }

                    if (state.clickInfo && selected) {
                        state.selected = i;
                        state.clickInfo = null;
                    }

                    totalHeight += thisHeight + h * 0.025;
                }
                state.maxHeight = Math.max(0, totalHeight - h * 0.75) * -1;
            } else {
                state.selected = -1;
                g.setClip(originalClip);
                g.setColor(rgbaToColor(0, 0, 0, 70));
                g.fillRect(0, 0, w, h);
                g.setColor(Color.WHITE);
                g.setFont(Resources.getSystemFont("SansSerif").deriveFont(Font.PLAIN, h * 0.1));
                g.drawString("没有可用选项 No available options", 0, h * 0.5);
            }
            g.setClip(originalClip);

            g.setColor(rgbaToColor(64, 64, 64, 35));
            g.fillRect(w * 0.31, h * 0.16, w * 0.49, h * 0.62);

            if (state.selected != -1) {
                if (!state.contentScoll) state.contentScoll = -1;
                let thisConfig = configPageList[state.selected];
                let totalHeight = h * 0.01;
                let currentY = h * 0.2 + state.contentScoll;

                // g.setClip(new java.awt.Rectangle(w * 0.31, h * 0.16, w * 0.49, h * 0.62));

                if (thisConfig.val.contentImage) {
                    g.drawImage(
                        loadResource("image", thisConfig.val.contentImage.img),
                        w * 0.375,
                        currentY,
                        w * 0.45,
                        ((w * 0.45) / thisConfig.val.contentImage.width) * thisConfig.val.contentImage.height,
                        null
                    );
                    currentY += ((w * 0.45) / thisConfig.val.contentImage.width) * thisConfig.val.contentImage.height + h * 0.05;
                    totalHeight += ((w * 0.45) / thisConfig.val.contentImage.width) * thisConfig.val.contentImage.height + h * 0.05;
                }

                g.setColor(Color.WHITE);
                let contentText = thisConfig.val.contentText;
                // if (contentText == "" || !contentText) contentText = ComponentUtil.getString(ComponentUtil.translatable("cfg.no_detail"));
                let textLines = TextUtil.isCjk(contentText) ? getCjkLineWrap(g, contentText, font, h * 0.03, w * 0.47) : getNoncjkLineWrap(g, contentText, font, h * 0.03, w * 0.47);
                for (let j = 0; j < textLines.length; j++) {
                    drawStrUnified(g, font, textLines[j], w * 0.605, currentY, h * 0.025, 1);
                    currentY += h * 0.04;
                    totalHeight += h * 0.04;
                }

                state.contentMaxHeight = Math.max(0, totalHeight - h * 0.65) * -1;
                g.setClip(originalClip);

                let confirmSelected = mx > w * 0.31 && mx < w * 0.9 && my > h * 0.81 && my < h * 0.89;
                g.setColor(confirmSelected ? rgbaToColor(64, 64, 64, 65) : rgbaToColor(64, 64, 64, 35));
                g.fillRect(w * 0.31, h * 0.81, w * 0.59, h * 0.08);
                g.setColor(Color.WHITE);
                g.setFont(font.deriveFont(Font.PLAIN, lineHeight * 0.35));
                drawStrUnified(g, font, ComponentUtil.getString(ComponentUtil.translatable("cfg.confirm")), w * 0.605, h * 0.865, h * 0.04, 1);

                if (state.clickInfo && confirmSelected) {
                    g.drawImage(bgImage, 0, 0, w, h, null);
                    g.setColor(rgbaToColor(0, 0, 0, 60));
                    g.fillRect(0, 0, w, h);
                    g.setColor(Color.WHITE);
                    drawStrUnified(g, font, ComponentUtil.getString(ComponentUtil.translatable("cfg.loading")), w * 0.5, h * 0.5, h * 0.1, 1);

                    // setDebugInfo("trying to save config " + state.saveKey + " " + JSON.stringify(thisConfig));
                    let finalConfig = state.eyecandy.state.config;
                    if (!finalConfig) finalConfig = {};
                    finalConfig[state.saveKey] = thisConfig.val.content;
                    if (thisConfig.val.default) {
                        for (let key in thisConfig.val.default) if (thisConfig.val.default.hasOwnProperty(key)) finalConfig[key] = thisConfig.val.default[key];
                    }
                    screen.state.eyecandy.state.config = finalConfig;
                    // setDebugInfo("Config: " + JSON.stringify(finalConfig));
                    MinecraftClient.setScreen(state.parent);
                }
            } else {
                g.setColor(Color.WHITE);
                drawStrUnified(g, font, "请在左侧进行选择", w * 0.35, h * 0.3, h * 0.05, 0);

                g.setColor(rgbaToColor(64, 64, 64, 35));
                g.fillRect(w * 0.31, h * 0.81, w * 0.59, h * 0.08);
                g.setColor(Color.GRAY);
                g.setFont(font.deriveFont(Font.PLAIN, lineHeight * 0.35));
                drawStrUnified(g, font, ComponentUtil.getString(ComponentUtil.translatable("cfg.confirm")), w * 0.605, h * 0.865, h * 0.04, 1);
            }

            //临时加的, 往文档的链接
            {
                let pdbox = { x1: w * 0.125, y1: h * 0.95, x2: w * 0.875, y2: h * 0.99 };
                let selected = mx >= pdbox.x1 && mx <= pdbox.x2 && my >= pdbox.y1 && my <= pdbox.y2;
                g.setColor(selected ? rgbaToColor(64, 64, 64, 60) : rgbaToColor(64, 64, 64, 80));
                g.fillRect(w * 0.125, h * 0.95, w * 0.75, h * 0.04);
                g.setColor(Color.WHITE);
                g.setFont(loadResource("font", "mtrsteamloco:fonts/source-han-sans-bold.otf").deriveFont(Font.PLAIN, h * 0.03));
                g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.respack")), w * 0.15, h * 0.985);
                if (state.clickInfo && selected) {
                    openUri("https://doc.fangsu.top");
                    state.clickInfo = null;
                }
            }

            // g.setColor(Color.RED);
            // g.drawString("Roll: " + String(state.roll) + "/" + String(state.maxHeight), 50, 50);
            // g.drawString("Roll: " + String(state.contentScoll) + "/" + String(screen.contentMaxHeight), 500, 50);

            state.clickInfo = null;
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
