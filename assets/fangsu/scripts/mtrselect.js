/**
 * @license
 * Copyright (c) 2025 596wjr. All rights reserved.
 * 
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/
 * 
 * 注意：
 * - 二次开发必须保留此版权声明及许可协议链接
 * - 禁止未经作者书面许可用于商业用途
 */
// ver 250519

function buildSelectScreen(eyecandy, selectOne, parent) {
    let screen = new IScreen.WithTextrue(ComponentUtil.literal("screen"));
    if (!screen.state.currentPage) screen.state.currentPage = 0;
    screen.initFunction = (screen, w, h) => {
        let state = screen.state;
        let tex = screen.texture;
        let th = tex.height;
        state.eyecandy = eyecandy;
        state.lineHeight = th / 16;
        state.w = w;
        state.h = h;
        state.roll = [];
        state.inEditing = -1;
        state.station = MinecraftClient.getStationAt(eyecandy.entity.getWorldPosVector3f());
        state.selectOne = selectOne;
        state.parent = parent;
        if (state.station == null) state.platforms = [];
        else state.platforms = getPlatformByStation(state.station);
    }
    screen.onCloseFunction = screen => {
        MinecraftClient.setScreen(parent);
    }
    return screen;
}

function drawPlatformSelectScreen(screen) {
    screen.renderFunction = (screen, x, y, d) => {
        let tex = screen.texture;
        if (tex.isClosed()) { screen.texture = new GraphicsTexture(screen.state.cacheTexInfo.w, screen.state.cacheTexInfo.h); }
        let state = screen.state;

        try {
            let drawPlats = [];
            for (let plat of state.platforms) {
                print("[DEBUG] platform:", plat)
                drawPlats.push({ text: (plat.name || "?") + " -> " + String(mergeDisplayStrings(getDestinationByPlatId(String(new java.lang.Long(plat.id))))), id: String(new java.lang.Long(plat.id)) });
            }
            print("[DEBUG] plats: ", drawPlats)
            drawMtrMainSelectionScreen(screen, 1, [drawPlats], x, y, d);
            state.clickInfo = null; state.rollInfo = null;
        }
        catch (e) {
            dispErrScreen(e);
        }
    }

    screen.mouseScrolledFunction = (screen, x, y, val) => {
        let tex = screen.texture;
        let { width: w, height: h } = tex;
        let state = screen.state;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        screen.state.rollInfo = { x: mx, y: my, val };
        return true;
    }

    screen.charTypedFunction = (screen, chr, v) => {
        screen.state.cacheChr += chr;
        return true;
    }

    screen.keyReleasedFunction = (screen, a, b, c) => {
        if (a == 259) screen.state.haveBkSp = true;
        if (a == 263) screen.state.haveArrl = true;
        if (a == 262) screen.state.haveArrr = true;
        return true;
    }

    screen.mouseReleasedFunction = (screen, x, y, i) => {
        let tex = screen.texture;
        let { width: w, height: h } = tex;
        let state = screen.state;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        screen.state.clickInfo = { x: mx, y: my };
        return true;
    }
}

function drawRouteSelectScreen(screen) {
    screen.renderFunction = (screen, x, y, d) => {
        let tex = screen.texture;
        if (tex.isClosed()) { screen.texture = new GraphicsTexture(screen.state.cacheTexInfo.w, screen.state.cacheTexInfo.h); }
        let state = screen.state;

        try {
            let drawPlats = [];
            for (let plat of state.platforms) {
                // print("[DEBUG] platform:", plat)
                drawPlats.push({ text: (plat.name || "?") + " -> " + String(mergeDisplayStrings(getDestinationByPlatId(String(new java.lang.Long(plat.id))))), id: String(new java.lang.Long(plat.id)) });
            }
            if (state.cacheDrawRoutes == undefined) state.cacheDrawRoutes = [];
            let drawRoutes = state.cacheDrawRoutes;
            if (state.select) if (state.select[0]) if (state.cachePlat != state.select[0][0]) {
                drawRoutes = [];
                state.cachePlat = state.select[0][0];
                // print("[DEBUG] Selected plat: ", state.select[0][0].id)
                let platRoute = state.select[0] ? getRouteWithCondition([{ type: "platformId", val: new java.lang.Long(state.select[0][0].id) }]) : [];
                for (let route of platRoute) {
                    // print("[DEBUG] Route: ", route)
                    // let objRoute = routeToObj(route);
                    drawRoutes.push({ rectColor: intToColor(route.color), text: (route.name || "?"), id: String(new java.lang.Long(route.id)) });
                }
                state.cacheDrawRoutes = drawRoutes;
            }
            // print("[DEBUG] plats: ", drawPlats)
            drawMtrMainSelectionScreen(screen, 2, [drawPlats, drawRoutes], x, y, d);
            state.clickInfo = null; state.rollInfo = null;
        }
        catch (e) {
            dispErrScreen(e);
        }
    }

    screen.mouseScrolledFunction = (screen, x, y, val) => {
        let tex = screen.texture;
        let { width: w, height: h } = tex;
        let state = screen.state;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        screen.state.rollInfo = { x: mx, y: my, val };
        return true;
    }

    screen.charTypedFunction = (screen, chr, v) => {
        screen.state.cacheChr += chr;
        return true;
    }

    screen.keyReleasedFunction = (screen, a, b, c) => {
        if (a == 259) screen.state.haveBkSp = true;
        if (a == 263) screen.state.haveArrl = true;
        if (a == 262) screen.state.haveArrr = true;
        return true;
    }

    screen.mouseReleasedFunction = (screen, x, y, i) => {
        let tex = screen.texture;
        let { width: w, height: h } = tex;
        let state = screen.state;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        screen.state.clickInfo = { x: mx, y: my };
        return true;
    }
}

function drawMtrMainSelectionScreen(screen, part, partItem, x, y, d) {
    let tex = screen.texture;
    let g = tex.graphics;
    let state = screen.state;
    let font = loadRes(resSc, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf");
    let { width: w, height: h } = tex;
    let posRateX = w / state.w;
    let posRateY = h / state.h;
    let mx = x * posRateX;
    let my = y * posRateY;
    let select = state.select;
    let roll = state.roll || [];
    let lineHeight = h * 0.1;

    if (select === undefined) {
        select = [];
        state.select = [];
    }

    g.setColor(Color.BLACK);
    g.fillRect(0, 0, w, h);
    g.drawImage(loadRes(res, "img", "mtrsteamloco:cfg/sr2.png"), 0, 0, w, h, null);
    g.setColor(rgbaToColor(0, 0, 0, 60));
    g.fillRect(0, 0, w, h);
    //搜索框预留: y h*0.05 - h*0.1

    //主绘制区域: y h*0.15 - h*0.8
    let partWidth = w * 0.9 / part;
    for (let i = 0; i < part; i++) {
        if (roll[i] == undefined) roll[i] = 0;
        let maxRoll = lineHeight * partItem[i].length;
        if (state.rollInfo) if (mouseInBox(mx, my, currentX + w * 0.01, h * 0.15, partWidth - w * 0.02, h * 0.65)) {
            roll[i] -= state.rollInfo.val;
            if (roll[i] > 0) roll[i] = 0;
            if (roll[i] < -1 * maxRoll) roll[i] = -1 * maxRoll;
        }
        let currentX = w * 0.05 + i * partWidth;
        g.setColor(rgbaToColor(0, 0, 0, 30));
        g.fillRect(currentX + w * 0.01, h * 0.15, partWidth - w * 0.02, h * 0.65);
        let originalClip = g.getClip();
        g.setClip(new java.awt.Rectangle(currentX + w * 0.01, h * 0.15, partWidth - w * 0.02, h * 0.65));
        if (partItem[i].length == 0) {
            g.setColor(Color.WHITE);
            g.setFont(font.deriveFont(lineHeight * 0.35));
            g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.no_available_item")), currentX + partWidth * 0.5 - g.getFontMetrics(font.deriveFont(lineHeight * 0.35)).stringWidth(ComponentUtil.getString(ComponentUtil.translatable("cfg.no_available_item"))) * 0.5, h * 0.5);
        }
        for (let j = 0; j < partItem[i].length; j++) {
            let thisItem = partItem[i][j];
            let currentY = roll[i] + h * 0.15 + lineHeight * j;
            let pointed = mouseInBox(mx, my, currentX + w * 0.02, currentY + w * 0.01, partWidth - w * 0.04, lineHeight - w * 0.02);
            let currentSelecIndex = select[i] !== undefined ? select[i].findIndex(obj => obj.id === thisItem.id) : -1;
            let selected = select[i] !== undefined
                ? currentSelecIndex > -1
                : false;;
            g.setColor(selected ? Color.WHITE : pointed ? rgbaToColor(0, 0, 0, 10) : rgbaToColor(0, 0, 0, 25));
            g.fillRect(currentX + w * 0.02, currentY + w * 0.01, partWidth - w * 0.04, lineHeight - w * 0.02);
            g.setFont(font.deriveFont(lineHeight * 0.35));
            g.setColor(selected ? Color.BLACK : Color.WHITE);
            g.drawString(thisItem.text, currentX + w * 0.025 + (thisItem.rectColor ? partWidth * 0.025 : 0), currentY + lineHeight * 0.6);
            if (thisItem.rectColor) {
                g.setColor(thisItem.rectColor);
                g.fillRect(currentX + w * 0.025, currentY + lineHeight * 0.25, partWidth * 0.02, lineHeight * 0.5)
            }
            if (state.clickInfo && pointed) {
                if (state.select[i] == undefined) state.select[i] = [];
                if (state.selectOne || i < part - 1) {
                    // state.select[i].fill(false);
                    state.select[i] = [thisItem];
                } else {
                    if (state.select[i] === undefined) state.select[i] = [thisItem];
                    else if (selected) state.select[i].splice(currentSelecIndex);
                    else state.select[i].push(thisItem);
                }
                state.clickInfo = null;
            }
        }
        g.setClip(originalClip);
    }

    //确定按钮: h*0.85 - h*0.925
    let confirmPointed = mouseInBox(mx, my, w * 0.06, h * 0.85, w * 0.88, h * 0.075);
    let confirmAvailable = false;
    if (state.select[part - 1] !== undefined) if (state.select[part - 1].length > 0) confirmAvailable = true;
    g.setColor(confirmAvailable ? confirmPointed ? rgbaToColor(65, 65, 65, 60) : rgbaToColor(65, 65, 65, 75) : rgbaToColor(65, 65, 65, 90));
    g.fillRect(w * 0.06, h * 0.85, w * 0.88, h * 0.075);
    g.setColor(confirmAvailable ? Color.WHITE : Color.GRAY);
    g.setFont(font.deriveFont(lineHeight * 0.35));
    g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.confirm")), w * 0.5 - g.getFontMetrics(font.deriveFont(lineHeight * 0.35)).stringWidth(ComponentUtil.getString(ComponentUtil.translatable("cfg.confirm"))) * 0.5, h * 0.91);
    if (confirmAvailable && confirmPointed && state.clickInfo) {
        state.eyecandy.state.mtrSelection = state.select;
        MinecraftClient.setScreen(state.parent);
    }
    drawWaterPrint(g, w, h);
    tex.upload();
}

function mouseInBox(mx, my, x, y, w, h) {
    // 计算矩形的实际左上角和右下角坐标
    var x1 = w >= 0 ? x : x + w;  // 如果 w 为负，实际 x1 是 x + w（向左扩展）
    var y1 = h >= 0 ? y : y + h;  // 如果 h 为负，实际 y1 是 y + h（向上扩展）
    var x2 = w >= 0 ? x + w : x;  // 如果 w 为负，实际 x2 是原始 x
    var y2 = h >= 0 ? y + h : y;  // 如果 h 为负，实际 y2 是原始 y

    // 判断鼠标坐标是否在矩形范围内
    return mx >= x1 && mx <= x2 && my >= y1 && my <= y2;
}

/**
 * 执行模糊搜索
 * @param {String} searchText 搜索文本（空字符串时返回所有项）
 * @param {Array<{text: String}>} items 待搜索数组
 * @returns {Array} 匹配的项（保持原顺序）
*/
function performSearch(searchText, items) {
    // 空搜索返回所有项（浅拷贝避免污染原数组）
    if (searchText == "") return [items];

    // 预处理：转为小写并拆分搜索词
    var searchTerms = searchText.toLowerCase().split(/\s+/);
    let lastMatchIndex = -1;

    return items.filter(item => {
        var target = item.text.toLowerCase();

        // 渐进式匹配：后续词必须在上一匹配位置之后出现
        return searchTerms.every(term => {
            var index = target.indexOf(term, lastMatchIndex + 1);
            if (index > -1) {
                lastMatchIndex = index;
                return true;
            }
            return false;
        });
    });
}

function mergeDisplayStrings(arr) {
    let cjkParts = [];
    let nonCjkParts = [];
    let hasValidEntry = false;

    for (let str of arr) {
        // 处理空值保护
        var sanitizedStr = str || "";

        // 获取有效部分并过滤纯空值
        var cjk = getMatching(sanitizedStr, true).trim();
        var nonCjk = getMatching(sanitizedStr, false).trim();

        // 标记有效条目
        if (cjk || nonCjk) hasValidEntry = true;

        // 保留非空有效内容（允许单独存在中文或英文）
        if (cjk || sanitizedStr.includes("|")) cjkParts.push(cjk);
        if (nonCjk || sanitizedStr.includes("|")) nonCjkParts.push(nonCjk);
    }

    // 处理全空情况
    if (!hasValidEntry) return "未定义|Undefined";

    // 构建结果并清理空段
    var cleanCJK = cjkParts.filter(Boolean).join('/');
    var cleanNonCJK = nonCjkParts.filter(Boolean).join('/');

    // 处理单边为空的情况
    return `${cleanCJK || " "}|${cleanNonCJK || " "}`
        .replace(/ \//g, '/').replace(/\/ /g, '/')  // 清理边界空格
        .replace(/^\|/, ' |').replace(/\|$/, '| ')   // 保留单边结构
        .replace(/\/\//g, '/');                     // 防止连续斜杠
}