var resSign = {};

function buildSignScreen(eyecandy) {
    var signItemList = JSON.parse(loadRes(resSign, "str", "fangsu:sign/builtinsign.json")).signItems.concat(convertConfigToSign(loadResource("json", "mtr:mtr_custom_resources.json")));
    print("[DEBUG] final sign items : ", signItemList.toString())
    let screen = new IScreen.WithTextrue(ComponentUtil.literal("screen"));
    let state = screen.state;
    // let tex = screen.texture;
    // let g = tex.graphics;
    state.eyecandy = eyecandy;

    state.flag = 0;
    // state.bg = loadRes(resSign, "image", "mtrsteamloco:cfg/bg.png");
    state.inEditing = {};
    // state.skipFirstClick = true;

    screen.initFunction = (screen, w, h) => {
        let state = screen.state;
        state.w = w;
        state.h = h;
        state.rollSel = [0, 0, 0, 0, 0, 0];
    }
    screen.mouseScrolledFunction = (screen, x, y, val) => {
        let state = screen.state;
        let tex = screen.texture;
        // let g = tex.graphics;
        let { width: w, height: h } = tex;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        let posRateY = screen.texture.height / screen.state.h;
        screen.state.scrollInfo = { x: mx, y: my, roll: val * posRateY };
        return true;
    }

    screen.mouseReleasedFunction = (screen, x, y, i) => {
        if (screen.state.skipFirstClick) {
            screen.state.skipFirstClick = false;
            return true;
        }
        let state = screen.state;
        let tex = screen.texture;
        // let g = tex.graphics;
        let { width: w, height: h } = tex;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        screen.state.clickInfo = { x: mx, y: my };
        return true;
    }

    screen.onCloseFunction = screen => {
        screen.state.flag -= 1;
        print("[DEBUG] flag: ", screen.state.flag)
        if (screen.state.flag < 0) {
            screen.state.eyecandy.state.needRefTex = true;
            screen.state.eyecandy.block.putCustomConfig("dispItems", JSON.stringify(eyecandy.state.disp));
            screen.state.eyecandy.block.sendUpdateC2S();
            MinecraftClient.setScreen(null);
        }
        else { screen.texture = new GraphicsTexture(screen.state.cacheTexInfo.w, screen.state.cacheTexInfo.h); MinecraftClient.setScreen(screen); state.skipFirstClick = false; }
    }

    screen.renderFunction = (screen, x, y, d) => {
        let state = screen.state;
        let tex = screen.texture;
        if (tex.isClosed()) { screen.texture = new GraphicsTexture(screen.state.cacheTexInfo.w, screen.state.cacheTexInfo.h); }
        let g = tex.graphics;
        let { width: w, height: h } = tex;
        let mx = w / state.w * x;
        let my = h / state.h * y;
        state.cacheTexInfo = { w, h };

        function drawSelectionScreen() {
            //显示正反面选择
            let i = 0;
            let { width: w, height: h } = tex;
            let lineHeight = h * 0.1647;
            let u = lineHeight * 0.6;
            let originalClip = g.getClip();
            g.setColor(Color.BLACK);
            g.fillRect(0, 0, w, h);
            for (let sideProp in eyecandy.state.disp) {
                if (sideProp != "front" && sideProp != "back") continue;
                let side = eyecandy.state.disp[sideProp];
                for (let j = 0; j <= 2; j++) {
                    i++;
                    let part = side[j];
                    let drawY = h * 0.1667 * (i - 1) + h * 0.01;

                    var drawDetail = parseDrawDetail(g, part);

                    var finalWidth = (0.1 * (drawDetail.length - 1) + (drawDetail.reduce((total, item) => total + item.width, 0))) * u;
                    var maxScoll = [0, 0];

                    let selected = (my > drawY) && (my <= drawY + lineHeight);
                    g.setClip((new java.awt.Rectangle(0, drawY, w, lineHeight)));

                    g.setColor(Color.BLACK);
                    g.fillRect(0, drawY + lineHeight * 0.2, w, lineHeight * 0.7);

                    if (selected) {
                        g.setColor(rgbaToColor(255, 255, 255, 20));
                        g.fillRect(0, drawY, w, lineHeight);
                    }

                    // let currentDrawInfo = { side: j, content: side[j] };
                    g.setColor(Color.WHITE);
                    g.setFont((loadRes(resSign, "font", "mtrsteamloco:fonts/ae.ttf")).deriveFont(lineHeight * 0.1));
                    switch (j) {
                        case 0:
                            g.drawString(ComponentUtil.getString(sideProp == "front" ? ComponentUtil.translatable("cfg.sign.front") : ComponentUtil.translatable("cfg.sign.back")) + " - " +
                                ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.left"))
                                , w * 0.001, drawY + lineHeight * 0.125);
                            maxScoll = [Math.min(0, w - finalWidth), 0]
                            break;
                        case 1:
                            g.drawString(ComponentUtil.getString(sideProp == "front" ? ComponentUtil.translatable("cfg.sign.front") : ComponentUtil.translatable("cfg.sign.back")) + " - " +
                                ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.middle"))
                                , w * 0.001, drawY + lineHeight * 0.125);
                            maxScoll = [Math.min(0, w * 0.5 - finalWidth * 0.5), Math.max(w, finalWidth * 0.5 - w * 0.5)]
                            break;
                        case 2:
                            g.drawString(ComponentUtil.getString(sideProp == "front" ? ComponentUtil.translatable("cfg.sign.front") : ComponentUtil.translatable("cfg.sign.back")) + " - " +
                                ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.right"))
                                , w * 0.001, drawY + lineHeight * 0.125);
                            maxScoll = [0, Math.max(0, finalWidth - w)]
                            break;
                    }
                    // g.drawString(maxScoll + "  " + drawDetail.reduce((total, item) => total + item.width, 0)
                    //     , w * 0.001, drawY + lineHeight * 0.25);

                    var currentX = state.rollSel[i - 1] + (j == 0 ? 0 : j == 2 ? w : w * 0.5 - finalWidth * 0.5);
                    var currentY = drawY + lineHeight * 0.25;
                    // g.drawString("CurrentX : " + String(currentX)
                    //     , w * 0.001, drawY + lineHeight * 0.375);

                    drawSignItems(g, resSign, drawDetail, j, currentX, currentY, u);

                    //scoll
                    if (state.scrollInfo) if (state.scrollInfo.y > drawY && state.scrollInfo.y <= drawY + lineHeight) {
                        state.rollSel[i - 1] += state.scrollInfo.roll * 10;
                        if (state.rollSel[i - 1] < maxScoll[0]) state.rollSel[i - 1] = maxScoll[0];
                        if (state.rollSel[i - 1] > maxScoll[1]) state.rollSel[i - 1] = maxScoll[1];
                        // print("[DEBUG] state.scrollInfo: ", JSON.stringify(state.scrollInfo));
                        // print("[DEBUG] state.rollSel: ", state.rollSel.toString());
                        state.scrollInfo = null;
                    }

                    //click
                    if (state.clickInfo) if (state.clickInfo.y > drawY && state.clickInfo.y <= drawY + lineHeight) {
                        // g.setColor(Color.BLACK);
                        // g.fillRect(0, 0, w, h);
                        // g.setColor(Color.WHITE);
                        // drawStrDL(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                        //     "加载中...|LOADING...", 0, h * 0.25, h * 0.1, 0, 1);
                        state.flag = 1;
                        state.inEditing = { face: sideProp, dq: j, j };
                        state.clickInfo = null;
                    }
                }
            }
            g.setClip(originalClip);
        }
        function drawEditingScreen() {
            //编辑特定面
            g.setColor(Color.BLACK);
            g.fillRect(0, 0, w, h);
            let side = eyecandy.state.disp[state.inEditing.face][state.inEditing.dq];
            let drawDetail = parseDrawDetail(g, side);
            let u = h * 0.125;
            var lineHeight = u;
            var finalWidth = (0.5 * (drawDetail.length - 1) + (drawDetail.reduce((total, item) => total + item.width, 0))) * u;
            g.setColor(Color.BLUE);
            g.fillRect((state.inEditing.j == 0 ? 0 : state.inEditing.j == 2 ? w : w * 0.5 - finalWidth * 0.5), 0, finalWidth, 20);
            var maxScoll = [0, 0];
            {
                var currentX = (state.inEditing.j == 0 ? 0 : state.inEditing.j == 2 ? w : w * 0.5 - finalWidth * 0.5) + (state.inEditing.j == 0 ? u * 0.5 : state.inEditing.j == 1 ? u * 0.25 : u * -0.5);
                var currentY = h * 0.025;
                g.setColor(Color.WHITE);
                g.setFont((loadRes(resSign, "font", "mtrsteamloco:fonts/ae.ttf")).deriveFont(h * 0.02));
                switch (state.inEditing.j) {
                    case 0:
                        g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.in_editing")) +
                            ComponentUtil.getString(state.inEditing.face == "front" ? ComponentUtil.translatable("cfg.sign.front") : ComponentUtil.translatable("cfg.sign.back")) + " - " +
                            ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.left")) + parseInt(w / (u * 1.1))
                            , w * 0.001, h * 0.02);
                        maxScoll = [Math.min(0, w - finalWidth), 0]
                        break;
                    case 1:
                        g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.in_editing")) +
                            ComponentUtil.getString(state.inEditing.face == "front" ? ComponentUtil.translatable("cfg.sign.front") : ComponentUtil.translatable("cfg.sign.back")) + " - " +
                            ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.middle"))
                            , w * 0.001, h * 0.02);
                        maxScoll = [Math.min(0, w * 0.5 - finalWidth * 0.5), Math.max(w, finalWidth * 0.5 - w * 0.5)]
                        break;
                    case 2:
                        g.drawString(ComponentUtil.getString(ComponentUtil.translatable("cfg.in_editing")) +
                            ComponentUtil.getString(state.inEditing.face == "front" ? ComponentUtil.translatable("cfg.sign.front") : ComponentUtil.translatable("cfg.sign.back")) + " - " +
                            ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.right"))
                            , w * 0.001, h * 0.02);
                        maxScoll = [0, Math.max(0, finalWidth - w)]
                        break;
                }
                var i = 0;

                //最开始的那个+
                if (drawDetail.length == 0) state.sideEditing = -1;
                let beginAddSel = state.inEditing.j == 2 ? (mx > currentX && mx < currentX + u * 0.5 && my > currentY && my < currentY + u) :
                    (mx > currentX - u * 0.5 && mx < currentX && my > currentY && my < currentY + u);
                if (beginAddSel || state.sideEditing == -1) {
                    g.setColor(Color.WHITE);
                    let addX = currentX + (state.inEditing.j != 2 ? u * 0.5 : state.inEditing.j == 1 ? u * 0.25 : u) - u;//纯粹的面向结果, 试了很多次就这么写效果是对的
                    g.fillRect(addX, currentY, u * 0.2, u * 0.05);
                    g.fillRect(addX, currentY, u * 0.05, u * 0.2);

                    g.fillRect(addX + u * 0.3, currentY, u * 0.2, u * 0.05);
                    g.fillRect(addX + u * 0.45, currentY, u * 0.05, u * 0.2);

                    g.fillRect(addX, currentY + u * 0.95, u * 0.2, u * 0.05);
                    g.fillRect(addX, currentY + u * 0.8, u * 0.05, u * 0.2);

                    g.fillRect(addX + u * 0.3, currentY + u * 0.95, u * 0.2, u * 0.05);
                    g.fillRect(addX + u * 0.45, currentY + u * 0.8, u * 0.05, u * 0.2);

                    if (beginAddSel || Date.now() / 1000 % 2 <= 1) {
                        g.fillRect(addX + u * 0.15, currentY + u * 0.475, u * 0.2, u * 0.05);
                        g.fillRect(addX + u * 0.225, currentY + u * 0.4, u * 0.05, u * 0.2);
                    }
                } if (state.clickInfo) {

                    if (beginAddSel) {
                        state.sideEditing = -1;
                        state.clickInfo = null;
                    }

                }

                for (var signItem of drawDetail) {
                    let j = state.inEditing.j;
                    var selected = j == 2 ? (mx > currentX - signItem.width * u && mx < currentX && my > currentY && my < currentY + u) :
                        (mx > currentX && mx < currentX + signItem.width * u && my > currentY && my < currentY + u);
                    var selectedEdit = j == 2 ? (mx > currentX - signItem.width * u && mx < currentX - 0.5 * signItem.width * u && my > currentY && my < currentY + u) :
                        (mx > currentX && mx < currentX + 0.5 * signItem.width * u && my > currentY && my < currentY + u);
                    var selectedDelete = j == 2 ? (mx > currentX - 0.5 * signItem.width * u && mx < currentX && my > currentY && my < currentY + u) :
                        (mx > currentX + 0.5 * signItem.width * u && mx < currentX + signItem.width * u && my > currentY && my < currentY + u);
                    var thisWidth = u;
                    if (signItem.type == "str") {
                        g.setColor(Color.WHITE);
                        thisWidth = drawStrDL(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                            signItem.content.text, currentX, currentY, u, j == 2 ? 2 : 0, signItem.content.duiqi || j) * (j == 2 ? -1 : 1);
                    } else if (signItem.type == "route") {
                        g.setColor(Color.WHITE);
                        thisWidth = drawStrDL(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                            signItem.content.text, currentX, currentY, u * 0.75, j == 2 ? 2 : 0, 1) * (j == 2 ? -1 : 1);
                        g.setColor(signItem.content.color);
                        g.fillRect(currentX, currentY + u * 0.8, thisWidth, u * 0.2);
                    }
                    else if (signItem.type == "routeb") {

                        thisWidth = signItem.width * u;
                        g.setColor(signItem.content.color);
                        g.fillRoundRect(currentX - (j == 2 ? thisWidth : 0), currentY, thisWidth, u, u * 0.05, u * 0.05);
                        g.setColor(isLightColor(signItem.content.color) ? Color.BLACK : Color.WHITE);
                        drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                            signItem.content.text, currentX + thisWidth * 0.5 * (j == 2 ? -1 : 1), currentY + u * 0.05, u * 0.9, 1, 1);

                    }
                    else if (signItem.type == "img") {
                        g.drawImage(loadRes(resSign, "img", signItem.content.img), currentX - (j == 2 ? u : 0), currentY, u, u, null);
                        thisWidth = u * (j == 2 ? -1 : 1);
                    }
                    else if (signItem.type == "space") {
                        g.setColor(Color.GRAY);
                        g.setStroke(new BasicStroke(u * 0.025));
                        g.drawRect(currentX + thisWidth, currentY, thisWidth * -1, u);
                        thisWidth = u * signItem.content.width * (j == 2 ? -1 : 1);
                    }
                    else if (signItem.type == "trainicon") {
                        g.setColor(signItem.content.color);
                        g.fillRoundRect(currentX - (j == 2 ? u : 0), currentY, u, u, u * 0.1, u * 0.1);
                        g.drawImage(loadRes(res, "img", signItem.content.img), currentX - (j == 2 ? u : 0), currentY, u, u, null);
                        thisWidth = u * (j == 2 ? -1 : 1);
                    }
                    if (selected) {
                        if (j == 2) {
                            g.setColor(rgbaToColor(255, 255, 255, 20));
                            g.fillRect(currentX + thisWidth, currentY, thisWidth * -1, u);
                            g.drawImage(loadRes(resSign, "img", selectedEdit ? "mtrsteamloco:cfg/edit_sel.png" : "mtrsteamloco:cfg/edit.png"),
                                currentX + 0.75 * signItem.width * u * -1 - u * 0.2, currentY + u * 0.3, u * 0.4, u * 0.4, null);
                            g.drawImage(loadRes(resSign, "img", selectedDelete ? "mtrsteamloco:cfg/del_sel.png" : "mtrsteamloco:cfg/del.png"),
                                currentX + 0.25 * signItem.width * u * -1 - u * 0.2, currentY + u * 0.3, u * 0.4, u * 0.4, null);
                        }
                        else {
                            g.setColor(rgbaToColor(255, 255, 255, 20));
                            g.fillRect(currentX, currentY, thisWidth, u);
                            g.drawImage(loadRes(resSign, "img", selectedEdit ? "mtrsteamloco:cfg/edit_sel.png" : "mtrsteamloco:cfg/edit.png"),
                                currentX + 0.25 * signItem.width * u - u * 0.2, currentY + u * 0.3, u * 0.4, u * 0.4, null);
                            g.drawImage(loadRes(resSign, "img", selectedDelete ? "mtrsteamloco:cfg/del_sel.png" : "mtrsteamloco:cfg/del.png"),
                                currentX + 0.75 * signItem.width * u - u * 0.2, currentY + u * 0.3, u * 0.4, u * 0.4, null);
                        }
                    }



                    var nextAddSel = j == 2 ? (mx > currentX + thisWidth - u * 0.5 && mx < currentX + thisWidth && my > currentY && my < currentY + u) :
                        (mx > currentX + thisWidth && mx < currentX + thisWidth + u * 0.5 && my > currentY && my < currentY + u);
                    if (nextAddSel || state.sideEditing == i) {
                        g.setColor(Color.WHITE);
                        let addX = currentX + thisWidth + (j == 2 ? u * -0.5 : 0);
                        g.fillRect(addX, currentY, u * 0.2, u * 0.05);
                        g.fillRect(addX, currentY, u * 0.05, u * 0.2);

                        g.fillRect(addX + u * 0.3, currentY, u * 0.2, u * 0.05);
                        g.fillRect(addX + u * 0.45, currentY, u * 0.05, u * 0.2);

                        g.fillRect(addX, currentY + u * 0.95, u * 0.2, u * 0.05);
                        g.fillRect(addX, currentY + u * 0.8, u * 0.05, u * 0.2);

                        g.fillRect(addX + u * 0.3, currentY + u * 0.95, u * 0.2, u * 0.05);
                        g.fillRect(addX + u * 0.45, currentY + u * 0.8, u * 0.05, u * 0.2);

                        if (nextAddSel || Date.now() / 1000 % 2 <= 1) {
                            g.fillRect(addX + u * 0.15, currentY + u * 0.475, u * 0.2, u * 0.05);
                            g.fillRect(addX + u * 0.225, currentY + u * 0.4, u * 0.05, u * 0.2);
                        }
                    }

                    if (state.clickInfo) {
                        if (selectedEdit) {
                            state.flag = 2;
                            state.inEditing = { face: state.inEditing.face, dq: state.inEditing.j, j: state.inEditing.j, editIngIndex: i };
                            state.alreadyEdited = false;
                            state.clickInfo = null;
                        }
                        if (selectedDelete) {
                            eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(i, 1);
                            state.clickInfo = null;
                        }
                        if (nextAddSel) {
                            state.sideEditing = i;
                            state.clickInfo = null;
                        }

                    }

                    currentX += (thisWidth + u * 0.5 * (j == 2 ? -1 : 1));
                    i++;
                }

                var lineItems = parseInt(w / (u * 1.1));
                let originalClip = g.getClip();
                g.setClip((new java.awt.Rectangle(0, u * 2, w, h - u * 2)));
                if (state.signItemRoll === undefined) state.signItemRoll = 0;
                if (state.scrollInfo) if (my >= u * 2) state.signItemRoll += state.scrollInfo.roll * u * 0.3;
                if (state.signItemRoll >= 0) state.signItemRoll = 0;
                if (state.signItemRoll < -1 * Math.ceil(signItemList.length / lineItems) * 1.1 * u + (h - u * 2)) state.signItemRoll = -1 * Math.ceil(signItemList.length / lineItems) * 1.1 * u + (h - u * 2);
                let signItemRoll = state.signItemRoll ? state.signItemRoll : 0;
                g.setColor(Color.WHITE);
                g.drawString(signItemRoll, 100, 100)

                for (let line = 0; lineItems * line < signItemList.length; line++) {
                    for (let column = 0; lineItems * line + column < signItemList.length && column < lineItems; column++) {
                        var itemIndex = lineItems * line + column;
                        var signItem = signItemList[itemIndex];
                        var currentY = u * (2 + (1.1) * line) + signItemRoll;
                        var currentX = u * (0.05 + (column * 1.1));
                        var selected = my >= u * 2 && mx > currentX && mx < currentX + u && my > currentY && my < currentY + u;
                        g.drawImage(loadRes(resSign, "img", signItem.icon), currentX, currentY, u, u, null);
                        if (selected) {
                            g.setColor(rgbaToColor(255, 255, 255, 25));
                            g.fillRect(currentX, currentY, u, u);
                        }
                        if (signItem.type == "img") {
                            if (selected) {
                                if (signItem.content.text) {
                                    var leftSelected = mx > currentX && mx < currentX + u * 0.35 && my > currentY && my < currentY + u;
                                    var middleSelected = mx > currentX + u * 0.35 && mx < currentX + u * 0.65 && my > currentY && my < currentY + u;
                                    var rightSelected = mx > currentX + u * 0.65 && mx < currentX + u && my > currentY && my < currentY + u;
                                    g.drawImage(loadRes(resSign, "img", leftSelected ? "fangsu:sign/img_tx_l_sel.png" : "fangsu:sign/img_tx_l.png"), currentX + u * 0.025, currentY + u * 0.425, u * 0.3, u * 0.15, null);
                                    g.drawImage(loadRes(resSign, "img", middleSelected ? "fangsu:sign/img_sel.png" : "fangsu:sign/img.png"), currentX + u * 0.425, currentY + u * 0.425, u * 0.15, u * 0.15, null);
                                    g.drawImage(loadRes(resSign, "img", rightSelected ? "fangsu:sign/img_tx_r_sel.png" : "fangsu:sign/img_tx_r.png"), currentX + u * 0.675, currentY + u * 0.425, u * 0.3, u * 0.15, null);
                                    if (state.clickInfo) {
                                        if (state.sideEditing || parseInt(state.sideEditing) === 0) {
                                            if (state.inEditing.j == 2) {
                                                if (leftSelected)
                                                    eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0,
                                                        JSON.parse(JSON.stringify(signItem)), { type: "str", content: { text: signItem.content.text, duiqi: 0 } });
                                                if (middleSelected)
                                                    eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0, JSON.parse(JSON.stringify(signItem)));
                                                if (rightSelected)
                                                    eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0,
                                                        { type: "str", content: { text: signItem.content.text, duiqi: 2 } }, JSON.parse(JSON.stringify(signItem)));
                                            } else {
                                                if (leftSelected)
                                                    eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0,
                                                        { type: "str", content: { text: signItem.content.text, duiqi: 2 } }, JSON.parse(JSON.stringify(signItem)));
                                                if (middleSelected)
                                                    eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0, JSON.parse(JSON.stringify(signItem)));
                                                if (rightSelected)
                                                    eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0, JSON.parse(JSON.stringify(signItem)),
                                                        { type: "str", content: { text: signItem.content.text, duiqi: 0 } });
                                            }
                                        }
                                        state.clickInfo = null;
                                        state.sideEditing = null;
                                    }
                                } else {
                                    g.drawImage(loadRes(resSign, "img", "fangsu:sign/img_sel.png"), currentX + u * 0.425, currentY + u * 0.425, u * 0.15, u * 0.15, null);
                                    if (state.clickInfo) {
                                        if (state.sideEditing || parseInt(state.sideEditing) === 0)
                                            eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0, JSON.parse(JSON.stringify(signItem)));

                                        state.clickInfo = null;
                                        state.sideEditing = null;
                                    }
                                }
                            }


                        }
                        else {
                            if (selected) {
                                g.drawImage(loadRes(resSign, "img", "fangsu:sign/add.png"), currentX + u * 0.425, currentY + u * 0.425, u * 0.15, u * 0.15, null);
                                if (state.clickInfo) {
                                    if (state.sideEditing || parseInt(state.sideEditing) === 0)
                                        eyecandy.state.disp[state.inEditing.face][state.inEditing.dq].splice(state.sideEditing + 1, 0, JSON.parse(JSON.stringify(signItem)));
                                    print("[DEBUG] Clicked ", JSON.stringify(signItem));

                                    state.clickInfo = null;
                                    state.sideEditing = null;
                                }
                            }
                        }

                    }
                }
                g.setClip(originalClip);
            }
        }
        function drawDetailScreen() {
            //特定项编辑
            let side = eyecandy.state.disp[state.inEditing.face][state.inEditing.dq];
            let editingItem = side[state.inEditing.editIngIndex];
            if (state.alreadyEdited) {
                state.inEditing.editIngIndex = undefined;
                if (editingItem.type == "str") {
                    if (state.config.editDetail_cjk != "" && state.config.editDetail_nonCjk != "") editingItem.content.text = state.config.editDetail_cjk + "|" + state.config.editDetail_nonCjk;
                    if (state.config.editDetail_cjk != "" && state.config.editDetail_nonCjk == "") editingItem.content.text = state.config.editDetail_cjk;
                    if (state.config.editDetail_cjk == "" && state.config.editDetail_nonCjk != "") editingItem.content.text = state.config.editDetail_nonCjk;
                    // state.editDetail_cjk = undefined; state.editDetail_nonCjk = undefined;
                }
                if (editingItem.type == "img") {
                    editingItem.content.img = state.config.editDetail_img;
                    // state.editDetail_img = undefined;
                } if (editingItem.type == "destination") {
                    editingItem.content.plat = String(new java.lang.Long(state.mtrSelection[0][0].id))
                    state.mtrSelection = undefined;
                } if (editingItem.type == "route" || editingItem.type == "routeb" || editingItem.type == "trainicon") {
                    editingItem.content.route = String(new java.lang.Long(state.mtrSelection[1][0].id));
                    state.mtrSelection = undefined;
                }
                if (editingItem.type == "space") {
                    editingItem.content.width = state.config.spaceWidth;
                }

                state.flag = 1;
                return;
            }

            g.setColor(Color.BLACK);
            g.fillRect(0, 0, w, h);

            let cfgItemList = [];
            let needCfgSc = false;
            print("[DEBUG] Now editing: ", JSON.stringify(editingItem), "  state.inEditing.editIngIndex: ", state.inEditing.editIngIndex)

            if (editingItem.type == "str") {
                needCfgSc = true;
                state.editDetail_cjk = getMatching(editingItem.content.text, true);
                state.editDetail_nonCjk = getMatching(editingItem.content.text, false);
                cfgItemList.push(buildConfigItem("中文文本", "str", { default: state.editDetail_cjk, savePos: "editDetail_cjk" }));
                cfgItemList.push(buildConfigItem("英文文本", "str", { default: state.editDetail_nonCjk, savePos: "editDetail_nonCjk" }));
            }
            else if (editingItem.type == "img") {
                needCfgSc = true;
                state.editDetail_img = editingItem.content.img;
                cfgItemList.push(buildConfigItem("中文文本", "str", { default: state.editDetail_img, savePos: "editDetail_img" }));
            }
            else if (editingItem.type == "space") {
                needCfgSc = true;
                cfgItemList.push(buildConfigItem("宽度", "num", { default: editingItem.content.width, savePos: "spaceWidth", max: 16, min: 0.1 }));
            } else if (editingItem.type == "destination") {
                needCfgSc = false;
                let cfgSc = buildSelectScreen({ state, ctx: state.eyecandy.ctx, entity: state.eyecandy.entity }, true, screen);
                drawPlatformSelectScreen(cfgSc);
                MinecraftClient.setScreen(cfgSc);
            } else if (editingItem.type == "route" || editingItem.type == "routeb" || editingItem.type == "trainicon") {
                needCfgSc = false;
                let cfgSc = buildSelectScreen({ state, ctx: state.eyecandy.ctx, entity: state.eyecandy.entity }, true, screen);
                drawRouteSelectScreen(cfgSc);
                MinecraftClient.setScreen(cfgSc);
            }

            if (needCfgSc) {
                let cfgSc = createConfigSc(cfgItemList, screen, { state }, { title: ComponentUtil.getString(ComponentUtil.translatable("cfg.title")) });
                // print("[DEBUG] Disping Cfg Sc")
                cfgSc.state.skipFirstClick = false;
                displayConfigSc(cfgSc);
            } state.alreadyEdited = true;
        }

        try {

            switch (state.flag) {
                case 0:
                    drawSelectionScreen();
                    state.clickInfo = null;
                    break;
                case 1:
                    drawEditingScreen();
                    state.clickInfo = null;
                    state.scrollInfo = null;
                    break;
                case 2:
                    drawDetailScreen();
                    state.clickInfo = null;
                    break;
                default:
                    throw new Error("错误的state.flag(这不应该出现)");
            }
            drawWaterPrint(g, w, h);
            tex.upload();


        } catch (e) {
            dispErrScreen(e);
        }
    }
    return screen;
}

function parseDrawDetail(g, dispObjList) {
    // print(dispObjList)
    var drawDetail = [];
    for (var dispObj of dispObjList) {
        if (dispObj.type == "str") {
            drawDetail.push({ type: "str", content: { text: dispObj.content.text, duiqi: dispObj.content.duiqi }, width: getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), dispObj.content.text, 100) / 100 });
        }
        else if (dispObj.type == "img") {
            drawDetail.push({ type: "img", content: { img: dispObj.content.img }, width: 1 })
        }
        else if (dispObj.type == "trainicon") {
            var routeThis = getRouteById(dispObj.content.route);
            if (routeThis)
                drawDetail.push({ type: "trainicon", content: { img: dispObj.icon, color: intToColor(routeThis.color) }, width: 1 });
            else
                drawDetail.push({ type: "trainicon", content: { img: dispObj.icon, color: Color.BLACK }, width: 1 });
        }
        else if (dispObj.type == "destination") {
            var dest = getDestinationByPlatId(dispObj.content.plat);
            drawDetail.push({ type: "str", content: { text: addPrefix(mergeDisplayStrings(dest), "开往|To", true), duiqi: dispObj.content.duiqi }, width: getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), addPrefix(mergeDisplayStrings(dest), "开往 |To "), 100) / 100 });
        }
        else if (dispObj.type == "route") {
            var routeThis = getRouteById(dispObj.content.route);
            if (routeThis) {
                if (isNumLine(routeThis.name))
                    drawDetail.push({
                        type: "route", content: { text: routeThis.name, color: intToColor(routeThis.color) }, width:
                            getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), getCJKLineName(getMatching(routeThis.name, true)), 80) / 100 +
                            getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), "号线|" + getMatching(routeThis.name, false), 75) / 100
                    });
                else
                    drawDetail.push({ type: "route", content: { text: routeThis.name, color: intToColor(routeThis.color) }, width: getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), routeThis.name, 75) / 100 });
            }
            else
                drawDetail.push({ type: "route", content: { text: "未定义|Unknown", color: rgbToColor(255, 255, 0) }, width: getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), "未定义|Undefined", 75) / 100 });
        }
        else if (dispObj.type == "routeb") {
            var routeThis = getRouteById(dispObj.content.route);
            if (routeThis)
                if (isNumLine(routeThis.name))
                    drawDetail.push({
                        type: "routeb", content: { text: routeThis.name, color: intToColor(routeThis.color) }, width: 0.1 +
                            getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), getCJKLineName(getMatching(routeThis.name, true)), 90) / 100 +
                            getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), "号线|" + getMatching(routeThis.name, false), 90) / 100
                    });
                else
                    drawDetail.push({ type: "routeb", content: { text: routeThis.name, color: intToColor(routeThis.color) }, width: 0.1 + getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), routeThis.name, 90) / 100 });
            else
                drawDetail.push({ type: "routeb", content: { text: "未定义|Unknown", color: rgbToColor(255, 255, 0) }, width: 0.1 + getDLStrWidth(g, loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(resSign, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), "未定义|Undefined", 100) / 100 });
        }
        if (dispObj.type == "space") {
            drawDetail.push({ type: "space", content: { width: dispObj.content.width }, width: dispObj.content.width });
        }
    }
    return drawDetail;

    function getDLStrWidth(g, cjkFont, nonCjkFont, str, h) {
        let drawCjkPart = getMatching(str, true);
        let drawNonCjkPart = getMatching(str, false);
        let cjkSize = drawNonCjkPart == "" ? h * 0.9 : h * 0.65;
        let nonCjkSize = drawCjkPart == "" ? h * 0.85 : h * 0.3;
        let drawCjkFont = cjkFont.deriveFont(cjkSize);
        let drawNonCjkFont = nonCjkFont.deriveFont(nonCjkSize);
        let drawCjkWidth = g.getFontMetrics(drawCjkFont).stringWidth(drawCjkPart);
        let drawNonCjkWidth = g.getFontMetrics(drawNonCjkFont).stringWidth(drawNonCjkPart);
        let drawStrWidth = Math.max(drawCjkWidth, drawNonCjkWidth);
        return drawStrWidth;
    }
}

function drawSignItems(g, res, drawDetail, duiqi, currentX, currentY, unit) {
    for (var signItem of drawDetail) {

        if (signItem.type == "str") {
            g.setColor(Color.WHITE);
            currentX += drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                signItem.content.text, currentX, currentY, unit, duiqi == 2 ? 2 : 0, signItem.content.duiqi || duiqi) * (duiqi == 2 ? -1 : 1);
        }
        else if (signItem.type == "route") {
            g.setColor(Color.WHITE);
            let thisWidth = 0;
            if (isNumLine(signItem.content.text)) {
                thisWidth += drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                    getCJKLineName(getMatching(signItem.content.text, true)), currentX - (duiqi == 2 ? signItem.width * unit : 0), currentY, unit * 0.8, 0, 0);
                thisWidth += drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                    "号线|" + getMatching(signItem.content.text, false), currentX - (duiqi == 2 ? signItem.width * unit : 0) + thisWidth, currentY, unit * 0.75, 0, 0);
            }
            else
                thisWidth = drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                    signItem.content.text, currentX, currentY, unit * 0.75, duiqi == 2 ? 2 : 0, 1);
            g.setColor(signItem.content.color);
            g.fillRect(currentX - (duiqi == 2 ? thisWidth : 0), currentY + unit * 0.8, thisWidth, unit * 0.2);
            currentX += thisWidth * (duiqi == 2 ? -1 : 1);
        }
        else if (signItem.type == "routeb") {

            let thisWidth = signItem.width * unit;
            g.setColor(signItem.content.color);
            g.fillRoundRect(currentX - (duiqi == 2 ? thisWidth : 0), currentY, thisWidth, unit, unit * 0.1, unit * 0.1);
            g.setColor(isLightColor(signItem.content.color) ? Color.BLACK : Color.WHITE);
            if (isNumLine(signItem.content.text)) {
                let numWidth = drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                    getCJKLineName(getMatching(signItem.content.text, true)), currentX + unit * 0.05 - (duiqi == 2 ? signItem.width * unit : 0), currentY, unit, 0, 0);
                drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                    "号线|" + getMatching(signItem.content.text, false), currentX + unit * 0.05 - (duiqi == 2 ? signItem.width * unit : 0) + numWidth, currentY + unit * 0.05, unit * 0.9, 0, 0);
            }
            else
                drawStrDL(g, loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"), loadRes(res, "font", "mtrsteamloco:fonts/source-han-sans-bold.otf"),
                    signItem.content.text, currentX + thisWidth * 0.5 * (duiqi == 2 ? -1 : 1), currentY + unit * 0.05, unit * 0.9, 1, 1);
            currentX += thisWidth * (duiqi == 2 ? -1 : 1);
        }
        else if (signItem.type == "img") {
            g.drawImage(loadRes(res, "img", signItem.content.img), currentX - (duiqi == 2 ? unit : 0), currentY, unit, unit, null);
            currentX += unit * (duiqi == 2 ? -1 : 1);
        }
        else if (signItem.type == "trainicon") {
            g.setColor(signItem.content.color);
            g.fillRoundRect(currentX - (duiqi == 2 ? unit : 0), currentY, unit, unit, unit * 0.1, unit * 0.1);
            g.drawImage(loadRes(res, "img", signItem.content.img), currentX - (duiqi == 2 ? unit : 0), currentY, unit, unit, null);
            currentX += unit * (duiqi == 2 ? -1 : 1);
        }
        else if (signItem.type == "space") {
            currentX += unit * signItem.content.width * (duiqi == 2 ? -1 : 1);
        }

        currentX += unit * signItem.width * 0.1 * (duiqi == 2 ? -1 : 1);

    }
}

function convertConfigToSign(mtr_costom_config) {
    var mtr_costom_config_signs = mtr_costom_config.custom_signs;
    var result = [];
    var textureMap = [];
    for (var key in mtr_costom_config_signs) {
        if (!mtr_costom_config_signs.hasOwnProperty(key)) continue;

        var item = mtr_costom_config_signs[key];

        if (textureMap.indexOf(item.texture_id) != -1) {
            continue; // 已存在的texture_id直接跳过
        }

        textureMap.push(item.texture_id);
        var entry = {
            type: "img",
            icon: item.texture_id,
            content: {
                img: item.texture_id
            }
        };
        if (item.custom_text) {
            entry.content.text = item.custom_text;
        }
        result.push(entry);
    }
    return result;
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
