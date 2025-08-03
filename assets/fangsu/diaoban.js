//script core ver 3.0.4

// include(Resources.id("mtrsteamloco:scripts/config_screen.js"));
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));
include(Resources.id("fangsu:scripts/pzx_helper.js"));
include(Resources.id("fangsu:scripts/costom_item_helper.js"));
include(Resources.id("fangsu:scripts/signsc.js"));
include(Resources.id("fangsu:scripts/mtrselect.js"));
include(Resources.id("fangsu:scripts/config_sc.js"));
include(Resources.id("fangsu:scripts/model_select_screen.js"));
include(Resources.id("fangsu:scripts/gt_helper.js"));
importPackage(java.awt);
importPackage(java.awt.geom);

function create(ctx, state, block) {
    state.mainModel = checkAndCacheConfig(block, state, "mainModel", "fangsu:diaoban/mtr_diaoban.json");

    state.subModel = checkAndCacheConfig(block, state, "subModel", "mtr_diaoban_a");

    state.dispInfo_save = checkAndCacheConfig(block, state, "dispInfo_save", JSON.stringify({ type: "mtr", mtr: 0, custom: "" }));
    state.dispInfo = JSON.parse(state.dispInfo_save);

    state.arrow = checkAndCacheConfig(block, state, "arrow", 0);

    state.plat = getPlatformById(checkConfig(block, "plat", 0));

    state.length = checkAndCacheConfig(block, state, "length", 2);
    state.doorlight = checkAndCacheConfig(block, state, "doorlight", 0);
    state.script = checkAndCacheConfig(block, state, "script", "fangsu:diaoban/blank.js");

    state.rendCd = 0;
    state.shape = [];

    state.needRef = true;

    state.cacheConfig = {};
    state.config = {};

    state.cacheMat = {
        rX: block.rotateX,
        rY: block.rotateY,
        rZ: block.rotateZ,
        tX: block.translateX,
        tY: block.translateY,
        tZ: block.translateZ
    };

    state.doorVal = block.doorTarget ? 1 : 0;

    state.dmh = new DynamicModelHolder();
    state.dmhdisp = new DynamicModelHolder();
    state.dmhdlon = new DynamicModelHolder();
    state.dmhdloff = new DynamicModelHolder();

    state.gtRtColor = new GraphicsTexture(16, 16);
    state.gtRtColor.graphics.setColor(Color.WHITE);
    state.gtRtColor.graphics.fillRect(0, 0, 16, 16);
}
function render(ctx, state, block) {
    if (JSON.stringify(state.config) != "{}" && state.config) setDebugInfo(JSON.stringify(state.config));
    if (state.config.mainModel) state.mainModel = state.config.mainModel;
    if (state.config.subModel) state.subModel = state.config.subModel;
    if (state.config.dispType) state.dispInfo.type = state.config.dispType;
    if (state.config.custom) state.dispInfo.custom = state.config.custom;
    if (state.config.length) state.length = state.config.length;
    if (state.config.doorlight || state.config.doorlight == false) state.doorlight = state.config.doorlight;
    if (state.config.script) state.script = state.config.script;
    if (state.config.arrow || state.config.arrow == 0) state.arrow = state.config.arrow;
    if (state.mtrSelection) {
        state.dispInfo.mtr = String(new java.lang.Long(state.mtrSelection[1][0].id));
        state.plat = getPlatformById(String(new java.lang.Long(state.mtrSelection[0][0].id)));
        block.putCustomConfig("plat", String(new java.lang.Long(state.plat.id)));
    }
    state.config = {};
    state.mtrSelection = null;
    if (state.rendCd <= 0) {
        state.dispInfo_save = JSON.stringify(state.dispInfo);
        state.needRef =
            checkCache(block, state, "subModel") ||
            checkCache(block, state, "dispInfo_save") ||
            checkCache(block, state, "arrow") ||
            checkCache(block, state, "length") ||
            checkCache(block, state, "doorlight") ||
            checkCache(block, state, "script") ||
            state.needRef;
        state.mainModelRef = checkCache(block, state, "mainModel");
    }
    if (state.needRef || state.mainModelRef) {
        let loaded = parseObj(JSON.parse(loadResource("str", state.mainModel)).content);
        if (state.subModel in loaded) state.model = loaded[state.subModel];
        else {
            if (state.mainModelRef) {
                state.model = JSON.parse(loadResource("str", state.mainModel)).content[0];
                block.putCustomConfig("subModel", state.model.key);
                block.sendUpdateC2S();
                state.mainModelRef = false;
            } else {
                setWarnInfo(`你似乎没有加载包含 ${state.mainModel}-${state.subModel} 的附属包 !`);
                state.needRef = false;
                return;
            }
        }
        // print(JSON.stringify(state.model));
        let model = loadResource("partedModel", state.model.model);
        let modelLeft = model.get(state.model.subModel.left).copy();
        modelLeft.sourceLocation = null;
        if (state.model.flipV) modelLeft.applyUVMirror(false, true);
        let modelRight = model.get(state.model.subModel.right).copy();
        modelRight.sourceLocation = null;
        if (state.model.flipV) modelRight.applyUVMirror(false, true);
        let modelMain = model.get(state.model.subModel.center).copy();
        modelMain.sourceLocation = null;
        if (state.model.flipV) modelMain.applyUVMirror(false, true);

        let finalRawModel = new RawModel();
        modelMain.applyTranslation((-0.5 * state.model.unit * (state.length - 1)) / 16 + 0.5, 0, 0);
        modelLeft.applyTranslation((-0.5 * state.model.unit * (state.length - 1)) / 16, 0, 0);
        modelRight.applyTranslation((0.5 * state.model.unit * (state.length - 1)) / 16, 0, 0);
        finalRawModel.append(modelLeft);
        finalRawModel.append(modelRight);
        if (state.model.shape.left)
            state.shape = mergeCollisionBoxes(state.shape, offsetCollisionBoxes(state.model.shape.left, "x", Number(state.model.unit) * -1 + 0.5 * state.model.unit * state.length + 4));
        if (state.model.shape.right) state.shape = mergeCollisionBoxes(state.shape, offsetCollisionBoxes(state.model.shape.right, "x", -0.5 * state.model.unit * state.length + 4));
        for (let i = 0; i < state.length - 2; i++) {
            if (state.model.shape.center)
                state.shape = mergeCollisionBoxes(state.shape, offsetCollisionBoxes(state.model.shape.center, "x", Number(state.model.unit) * (i + 1) - 0.5 * state.model.unit * state.length + 4));

            finalRawModel.append(modelMain.copy());
            modelMain.applyTranslation(state.model.unit / 16, 0, 0);
        }
        state.dmh.uploadLater(finalRawModel);

        if (state.model.doorlight) {
            state.dmhdlon.uploadLater(model.get(state.model.doorlight.on));
            state.dmhdloff.uploadLater(model.get(state.model.doorlight.off));
        }

        let rawModelBuilder = new RawMeshBuilder(4, "exterior", Resources.id("fangsu:pids/black.png"));
        let [y1, z1] = state.model.tex[0];
        let [y2, z2] = state.model.tex[1];
        let finalSlot = [
            [(-0.5 * state.model.unit * state.length) / 16 + state.model.left_space, y2, z2], // 左上 (X左，上点Y/Z)
            [(-0.5 * state.model.unit * state.length) / 16 + state.model.left_space, y1, z1], // 左下 (X左，下点Y/Z)
            [(0.5 * state.model.unit * state.length) / 16 - state.model.right_space, y1, z1], // 右下 (X右，下点Y/Z)
            [(0.5 * state.model.unit * state.length) / 16 - state.model.right_space, y2, z2]
        ];

        rawModelBuilder
            .vertex(finalSlot[0][0], finalSlot[0][1], finalSlot[0][2])
            .normal(0, 1, 0)
            .uv(0, 0)
            .endVertex()
            .vertex(finalSlot[1][0], finalSlot[1][1], finalSlot[1][2])
            .normal(0, 1, 0)
            .uv(0, 1)
            .endVertex()
            .vertex(finalSlot[2][0], finalSlot[2][1], finalSlot[2][2])
            .normal(0, 1, 0)
            .uv(1, 1)
            .endVertex()
            .vertex(finalSlot[3][0], finalSlot[3][1], finalSlot[3][2])
            .normal(0, 1, 0)
            .uv(1, 0)
            .endVertex();

        rawModelBuilder.color(200, 200, 200, 255);
        let dispRawModel = new RawModel();
        dispRawModel.append(rawModelBuilder.getMesh());
        dispRawModel.generateNormals();

        state.dmhdisp.uploadLater(dispRawModel);
        state.texW = state.model.texSize * state.length;
        state.texH = state.model.texSize;

        state.drawScript = String(loadResource("str", state.script));

        try {
            let gtHelper = getGtHelper();
            try {
                gtHelper.removeDrawGraphic(block);
            } catch (e) {}

            state.drawFunction = new Function(
                "g",
                "detail",
                `
                var state = detail.state;var drawInfo = detail.drawInfo;
                ${state.drawScript}
                draw(g, state, drawInfo);
            `
            );
            state.drawState = {};
            state.finalrouteInfo = null;
            if (state.dispInfo.type == "mtr") {
                let route = getRouteById(new java.lang.Long(state.dispInfo.mtr));
                if (route) {
                    state.finalrouteInfo = getRoutePlatform(route);
                    let stationNames = [];
                    state.finalrouteInfo.drawStations.forEach((stn) => stationNames.push(stn.stationName));
                    if (state.plat) {
                        let thisStn = getStationByPlatform(state.plat);
                        if (thisStn) state.index = stationNames.indexOf(thisStn.name);
                        else state.index = -1;
                    } else state.index = -1;
                } else {
                    state.finalrouteInfo = null;
                    state.index = -1;
                }
            } else state.finalrouteInfo = state.dispInfo.custom;
            let getDetailFunction = () => {
                let drawInfo = {
                    routeInfo: state.finalrouteInfo,
                    arrowDirection: state.arrow,
                    plat: state.plat,
                    index: state.index,
                    texArea: [0, 0, state.texW, state.texH],
                    ctx,
                    block,
                    entity: block
                };
                return { drawInfo, state: state.drawState };
            };
            gtHelper.addDrawGraphic(
                block,
                {
                    w: state.texW,
                    h: state.texH,
                    itemFamily: "diaoban",
                    extra: state.extraConfig,
                    dispInfo: JSON.stringify(state.dispInfo),
                    index: state.index,
                    isStatic: true,
                    script: state.script,
                    arrow: state.arrow
                },
                state.drawFunction,
                getDetailFunction
            );

            // setDebugInfo("refreshing | " + state.drawScript);
        } catch (e) {
            setErrorInfo("Failed to parse draw function :" + e + ` (${e.stack})`);
        }

        if (state.finalrouteInfo)
            if (state.finalrouteInfo.routeColor) {
                state.gtRtColor.graphics.setColor(state.finalrouteInfo.routeColor);
                state.gtRtColor.graphics.fillRect(0, 0, 16, 16);
                state.gtRtColor.upload();
            }
        state.needRef = false;
        state.needRefBox = true;
    }

    if (state.dmh.getUploadedModel() != null) {
        if (state.finalrouteInfo)
            if (state.finalrouteInfo.routeColor) {
                state.dmh.getUploadedModel().replaceTexture("routecolor.png", state.gtRtColor.identifier);
            }
        ctx.drawModel(state.dmh.getUploadedModel(), null);
    }
    if (state.dmhdisp.getUploadedModel() != null) {
        state.screenModel = state.dmhdisp.getUploadedModel();
        let gtHelper = getGtHelper();
        let gt = gtHelper.getBlockGraphics(block);
        if (gt) {
            state.screenModel.replaceAllTexture(gt.identifier);
            ctx.drawModel(state.screenModel, null);
        }
    }

    if (block.doorTarget || block.doorValue >= 0.6) {
        state.doorVal += Timing.delta() * 0.6;
        if (state.doorVal >= 1) state.doorVal = 1;
    } else {
        state.doorVal -= Timing.delta() * 0.6;
        if (state.doorVal <= 0) state.doorVal = 0;
    }

    if (state.doorlight)
        if (state.dmhdlon.getUploadedModel() && state.dmhdloff.getUploadedModel()) {
            if (state.model.doorlight.type == "simple") {
                if (state.doorVal > 0) ctx.drawModel(state.dmhdlon, null);
                else ctx.drawModel(state.dmhdloff, null);
            }
            if (state.model.doorlight.type == "blink") {
                if ((state.doorVal >= 0.2 && state.doorVal <= 0.4) || (state.doorVal >= 0.6 && state.doorVal <= 0.8) || state.doorVal >= 1) ctx.drawModel(state.dmhdlon, null);
                else ctx.drawModel(state.dmhdloff, null);
            }
        }

    if (
        state.cacheMat.rX != block.rotateX ||
        state.cacheMat.rY != block.rotateY ||
        state.cacheMat.rZ != block.rotateZ ||
        state.cacheMat.tX != block.translateX ||
        state.cacheMat.tY != block.translateY ||
        state.cacheMat.tZ != block.translateZ
    ) {
        // 如果有任一属性不同，则更新缓存并标记需要刷新
        state.cacheMat = {
            rX: block.rotateX,
            rY: block.rotateY,
            rZ: block.rotateZ,
            tX: block.translateX,
            tY: block.translateY,
            tZ: block.translateZ
        };
        state.needRefBox = true;
    }

    if (state.shape)
        if (state.needRefBox == true) {
            let shape = state.shape;
            let finalShape = [];
            if (shape == [[0, 0, 0, 16, 16, 16]]) {
                finalShape = [[0, 0, 0, 16, 16, 16]];
            } else
                for (let subshape of shape) {
                    // print(subshape);
                    // print(rotateCollisionBox(subshape, Math.PI * block.rotateX, Math.PI * block.rotateY, Math.PI * block.rotateZ));
                    finalShape = finalShape.concat(
                        rotateCollisionBox(subshape, block, block.rotateX, block.rotateY, block.rotateZ, block.translateX * 16, block.translateY * 16, block.translateZ * 16)
                    );
                }
            // print(finalShape);
            finalShape = collisionBoxArrToStr(finalShape);
            // print(finalShape);
            block.setShape(finalShape);
            block.setCollisionShape(finalShape);
            block.sendUpdateC2S();
            state.needRefBox = false;
        }
    state.renderCD -= Timing.delta();
    ctx.setDebugInfo("dispInfo", JSON.stringify(state.dispInfo));
}

function dispose(ctx, state, block) {
    state.dmh.close();
    state.dmhdisp.close();
    try {
        getGtHelper().removeDrawGraphic(block);
    } catch (e) {}
}

function use(ctx, state, block, player) {
    let configs = [];
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", {
            type: "diaoban",
            defaultVal: block.getCustomConfig("mainModel"),
            showConditition: true
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", {
            type: "diaoban",
            saveKey: "subModel",
            path: "content",
            showConditition: true
        })
    );
    configs.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.length")), "num", { default: state.length, isInt: true, min: 2, max: 30, savePos: "length" }));
    configs.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.diaoban.doorlight")), "bool", { default: state.doorlight, savePos: "doorlight", style: 2 }));
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.type")), "list", {
            default: state.dispInfo.type == "mtr" ? 0 : 1,
            savePos: "dispType",
            listItems: [
                { text: ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.mtr")), val: "mtr" }
                // ,{ text: ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.custom")), val: "custom" }
            ]
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.select_plat")), "function", {
            showConditition: () => checkCacheConfig(state, "dispType", 0),
            function: () => {
                var cfgSc = buildSelectScreen({ ctx, state, block, entity: block }, true, null);
                drawRouteSelectScreen(cfgSc);
                MinecraftClient.setScreen(cfgSc);
            }
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.edit_custom")), "function", {
            showConditition: () => checkCacheConfig(state, "dispType", 1),
            function: () => {
                setWarnInfo("有点bug, 先不放出来了");
                // let routeEditConfig = [];
                // routeEditConfig.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.import_from_rmg")), "str", { default: "", savePos: "rmg", lines: 15 }));
                // routeEditConfig.push(
                //     buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.confirm")), "function", {
                //         function: () => {
                //             state.dispInfo.custom = parseRmgRoute(state.cacheConfig.rmg);
                //         }
                //     })
                // );
                // displayConfigSc(createConfigSc(routeEditConfig, null, { ctx, state, entity: block, block }, { title: ComponentUtil.getString(ComponentUtil.translatable("cfg.ris_custom_title")) }));
            }
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.arrow")), "list", {
            default: state.arrow,
            savePos: "arrow",
            listItems: [
                { text: ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.arrownone")), val: 0 },
                { text: ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.arrowleft")), val: 1 },
                { text: ComponentUtil.getString(ComponentUtil.translatable("cfg.ris.arrowright")), val: 2 }
            ]
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.diaoban.select_script")), "function", {
            showConditition: () => checkCacheConfig(state, "dispType", 0),
            function: () => {
                var cfgSc = createSelectionScreen({ type: "content", path: "fangsu:diaoban/diaoban_scripts.json" }, null, "file", "script", { ctx, state, entity: block, block });
                displaySelectionScreen(cfgSc);
            }
        })
    );
    let sc = createConfigSc(configs, null, { ctx, state, entity: block, block }, { title: ComponentUtil.getString(ComponentUtil.translatable("cfg.title")) });
    displayConfigSc(sc);
}

function parseExpression(input) {
    if (input == "") return null;
    // 1. 删除所有空格
    let str = input.replace(" ", "");

    // 2. 查找括号位置
    let leftParen = str.indexOf("(");
    let rightParen = str.indexOf(")");

    // 3. 验证格式有效性
    if (leftParen === -1 || rightParen === -1 || leftParen >= rightParen) {
        setErrorInfo(`无效格式: ${input}`);
    }

    // 4. 提取主体部分和参数
    let subject = str.substring(0, leftParen);
    let param = str.substring(leftParen + 1, rightParen);

    // 5. 处理点号分隔的层级
    let dotIndex = subject.indexOf(".");

    return dotIndex !== -1
        ? {
              a: subject.substring(0, dotIndex), // 点号前的主对象
              c: subject.substring(dotIndex + 1), // 点号后的子属性 (可选)
              b: param // 括号内的参数
          }
        : {
              a: subject, // 无点号时只有主对象
              b: param // 括号内的参数
          };
}
