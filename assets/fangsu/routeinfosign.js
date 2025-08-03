//script core ver 3.0.3

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
    state.mainModel = checkAndCacheConfig(block, state, "mainModel", "fangsu:route_info_sign/mtr_route_info_sign.json");

    state.subModel = checkAndCacheConfig(block, state, "subModel", "mtr_ris_wm");

    state.dispInfo_save = checkAndCacheConfig(block, state, "dispInfo_save", JSON.stringify({ type: "mtr", mtr: 0, custom: "" }));
    state.dispInfo = JSON.parse(state.dispInfo_save);

    state.arrow = checkAndCacheConfig(block, state, "arrow", 0);

    state.plat = getPlatformById(checkConfig(block, "plat", 0));

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

    state.dmh = new DynamicModelHolder();
    state.dmhdisp = new DynamicModelHolder();
}
function render(ctx, state, block) {
    if (JSON.stringify(state.config) != "{}" && state.config) setDebugInfo(JSON.stringify(state.config));
    if (state.config.mainModel) state.mainModel = state.config.mainModel;
    if (state.config.subModel) state.subModel = state.config.subModel;
    if (state.config.dispType) state.dispInfo.type = state.config.dispType;
    if (state.config.custom) state.dispInfo.custom = state.config.custom;
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
        state.needRef = checkCache(block, state, "subModel") || checkCache(block, state, "dispInfo_save") || checkCache(block, state, "arrow") || state.needRef;
        state.mainModelRef = checkCache(block, state, "mainModel");
    }
    if (state.needRef || state.mainModelRef) {
        let loaded = parseObj(JSON.parse(loadResource("str", state.mainModel)).content);
        if (state.subModel in loaded) state.model = loaded[state.subModel];
        else {
            if (state.mainModelRef) {
                state.model = JSON.parse(loadRes(res, "str", state.mainModel)).content[0];
                block.putCustomConfig("subModel", state.model.key);
                block.sendUpdateC2S();
                state.mainModelRef = false;
            } else {
                setWarnInfo(`你似乎没有加载包含 ${state.mainModel}-${state.subModel} 的附属包 !`);
                state.needRef = false;
                return;
            }
        }

        let mainModel = loadResource("model", state.model.model);
        let model = state.model;
        // print("[DEBUG] ", JSON.stringify(model));
        let rawModel = mainModel.copy();
        rawModel.sourceLocation = null;
        if (model.flipV) rawModel.applyUVMirror(false, true);
        state.dmh.uploadLater(rawModel);

        let rawModelBuilder = new RawMeshBuilder(4, "exterior", Resources.id("fangsu:pids/black.png"));
        for (let slot of model.slots) {
            rawModelBuilder
                .vertex(slot[0][0], slot[0][1], slot[0][2])
                .normal(0, 1, 0)
                .uv(0, 0)
                .endVertex()
                .vertex(slot[1][0], slot[1][1], slot[1][2])
                .normal(0, 1, 0)
                .uv(0, 1)
                .endVertex()
                .vertex(slot[2][0], slot[2][1], slot[2][2])
                .normal(0, 1, 0)
                .uv(1, 1)
                .endVertex()
                .vertex(slot[3][0], slot[3][1], slot[3][2])
                .normal(0, 1, 0)
                .uv(1, 0)
                .endVertex();
        }
        rawModelBuilder.color(200, 200, 200, 255);
        let dispRawModel = new RawModel();
        dispRawModel.append(rawModelBuilder.getMesh());
        dispRawModel.generateNormals();

        state.dmhdisp.uploadLater(dispRawModel);
        state.texW = model.texSize[0];
        state.texH = model.texSize[1];

        state.drawScript = String(loadResource("str", state.model.script));

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
                    itemFamily: "RIS",
                    mainModel: state.mainModel,
                    subModel: state.subModel,
                    extra: state.extraConfig,
                    dispInfo: JSON.stringify(state.dispInfo),
                    index: state.index,
                    isStatic: true,
                    arrow: state.arrow
                },
                state.drawFunction,
                getDetailFunction
            );
        } catch (e) {
            setErrorInfo("Failed to parse draw function :" + e + ` (${e.stack})`);
        }
        state.needRef = false;
        state.needRefBox = true;
    }

    if (state.dmh.getUploadedModel() != null) {
        ctx.drawModel(state.dmh.getUploadedModel(), null);
    }
    if (state.dmhdisp.getUploadedModel() != null) {
        state.screenModel = state.dmhdisp.getUploadedModel();
        let gtHelper = getGtHelper();
        let gt = gtHelper.getBlockGraphics(block);
        if (gt) {
            // ctx.setDebugInfo("gt", gt);
            state.screenModel.replaceAllTexture(gt.identifier);
            ctx.drawModel(state.screenModel, null);
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

    if (state.model.shape)
        if (state.needRefBox == true) {
            let shape = state.model.shape;
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
            type: "route_info_sign",
            defaultVal: block.getCustomConfig("mainModel"),
            showConditition: true
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", {
            type: "route_info_sign",
            saveKey: "subModel",
            path: "content",
            showConditition: true
        })
    );
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
