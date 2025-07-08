//script core ver 3.0.2

include(Resources.id("mtrsteamloco:scripts/config_screen.js"));
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));
include(Resources.id("mtrsteamloco:scripts/platformselect.js"));
include(Resources.id("fangsu:scripts/pzx_helper.js"));
include(Resources.id("fangsu:scripts/mtrselect.js"));
include(Resources.id("fangsu:scripts/text_util.js"));
include(Resources.id("fangsu:scripts/config_sc.js"));
include(Resources.id("fangsu:scripts/costom_item_helper.js"));
importPackage(java.awt);
importPackage(java.awt.geom);

var res = {};

function create(ctx, state, block) {
    if (!block.getCustomConfig("mainModel")) {
        block.putCustomConfig("mainModel", "fangsu:pids/mtr_pids.json");
    }
    if (block.getCustomConfig("mainModel") == "fangsu:pids/default_pids.json") {
        block.putCustomConfig("mainModel", "fangsu:pids/mtr_pids.json");
    }
    if (!block.getCustomConfig("subModel")) {
        block.putCustomConfig("subModel", "mtr_pids_3b");
    }

    state.width = checkConfig(block, "width", 3);
    state.cacheWidth = state.width;
    state.height = checkConfig(block, "height", 2);
    state.cacheHeight = state.height;
    state.extraConfig = JSON.parse(checkConfig(block, "extraConfig", "{}"));
    block.sendUpdateC2S();

    state.platformState = JSON.parse(block.getCustomConfig("platformState"));
    if (state.platformState === null || state.platformState === undefined) state.platformState = [];
    // if (!block.getCustomConfig("platformState")) {
    //     block.putCustomConfig("platformState",
    //         "[]");
    //     block.sendUpdateC2S();
    // }

    state.cacheMainMod = block.getCustomConfig("mainModel");
    state.cacheSubMod = block.getCustomConfig("subModel");
    state.cachePlatformState = block.getCustomConfig("platformState");
    state.needRef = true;
    state.drawScript = "";
    state.dmh = new DynamicModelHolder();
    state.dmhdisp = new DynamicModelHolder();
    state.renderCD = 999;
    state.cacheMat = {
        rX: block.rotateX,
        rY: block.rotateY,
        rZ: block.rotateZ,
        tX: block.translateX,
        tY: block.translateY,
        tZ: block.translateZ
    };
    state.cacheConfig = {};
    state.config = {};
}

function render(ctx, state, block) {
    if (state.cacheMainMod != block.getCustomConfig("mainModel") || state.cacheSubMod != block.getCustomConfig("subModel") || state.cachePlatformState != block.getCustomConfig("platformState")) {
        state.needRef = true;
    }

    if (state.config.width) state.width = state.config.width;
    if (state.config.height) state.height = state.config.height;
    if (state.cacheWidth != block.getCustomConfig("width") || state.cacheWidth != state.width || state.cacheHeight != block.getCustomConfig("height") || state.cacheHeight != state.height) {
        state.needRef = true;
        if (state.cacheWidth != state.width || state.cacheHeight != state.height) {
            block.putCustomConfig("width", state.width);
            block.putCustomConfig("height", state.height);
            block.sendUpdateC2S();
            state.cacheWidth = state.width;
            state.cacheHeight = state.height;
        } else {
            state.width = block.getCustomConfig("width");
            state.height = block.getCustomConfig("height");
            state.cacheWidth = state.width;
            state.cacheHeight = state.height;
        }
    }
    if (JSON.stringify(state.config) !== "{}") {
        state.extraConfig = state.config;
        state.config = {};
        block.putCustomConfig("extraConfig", JSON.stringify(state.extraConfig));
        block.sendUpdateC2S();
    }

    if (state.mtrSelection)
        if (state.mtrSelection.length > 0)
            if (state.mtrSelection[0].length > 0) {
                state.platformState = [];
                for (let selection of state.mtrSelection[0]) {
                    state.platformState.push({ flag: true, platformId: String(new java.lang.Long(selection.id)) });
                }
                block.putCustomConfig("platformState", JSON.stringify(state.platformState));
                block.sendUpdateC2S();
            }

    if (state.needRef) {
        state.cacheMainMod = block.getCustomConfig("mainModel");
        state.cacheSubMod = block.getCustomConfig("subModel");
        state.cachePlatformState = block.getCustomConfig("platformState");

        let loaded = parseObj(JSON.parse(loadRes(res, "str", state.cacheMainMod)).content);
        if (state.cacheSubMod in loaded) state.model = loaded[state.cacheSubMod];
        else {
            state.model = JSON.parse(loadRes(res, "str", state.cacheMainMod)).content[0];
            block.putCustomConfig("subModel", state.model.key);
            block.sendUpdateC2S();
        }

        let texW, texH;
        if (state.model.shouldSpilt) {
            state.shape = [];

            let model = loadRes(res, "partedModel", state.model.model);

            let modelCenter = model.get(state.model.subModels.center).copy();
            modelCenter.sourceLocation = null;
            if (state.model.flipV) modelCenter.applyUVMirror(false, true);

            let modelLeft = model.get(state.model.subModels.left).copy();
            modelLeft.sourceLocation = null;
            if (state.model.flipV) modelLeft.applyUVMirror(false, true);

            let modelLeftTop = model.get(state.model.subModels.left_top).copy();
            modelLeftTop.sourceLocation = null;
            if (state.model.flipV) modelLeftTop.applyUVMirror(false, true);

            let modelLeftBottom = model.get(state.model.subModels.left_bottom).copy();
            modelLeftBottom.sourceLocation = null;
            if (state.model.flipV) modelLeftBottom.applyUVMirror(false, true);

            let modelTop = model.get(state.model.subModels.top).copy();
            modelTop.sourceLocation = null;
            if (state.model.flipV) modelTop.applyUVMirror(false, true);

            let modelBottom = model.get(state.model.subModels.bottom).copy();
            modelBottom.sourceLocation = null;
            if (state.model.flipV) modelBottom.applyUVMirror(false, true);

            let modelRight = model.get(state.model.subModels.right).copy();
            modelRight.sourceLocation = null;
            if (state.model.flipV) modelRight.applyUVMirror(false, true);

            let modelRightTop = model.get(state.model.subModels.right_top).copy();
            modelRightTop.sourceLocation = null;
            if (state.model.flipV) modelRightTop.applyUVMirror(false, true);

            let modelRightBottom = model.get(state.model.subModels.right_bottom).copy();
            modelRightBottom.sourceLocation = null;
            if (state.model.flipV) modelRightBottom.applyUVMirror(false, true);

            let finalWidth = parseInt(state.width / state.model.widthUnit);
            let finalHeight = parseInt(state.height / state.model.heightUnit);

            let finalRawModel = new RawModel();

            for (let i = 0; i < finalWidth; i++) {
                for (let j = 0; j < finalHeight; j++) {
                    let thisModel;
                    let thisShape;
                    if (j == 0) {
                        if (i == 0) {
                            thisModel = modelLeftBottom.copy();
                            thisShape = state.model.shape.left_bottom;
                        } else if (i == finalWidth - 1) {
                            thisModel = modelRightBottom.copy();
                            thisShape = state.model.shape.right_bottom;
                        } else {
                            thisModel = modelBottom.copy();
                            thisShape = state.model.shape.bottom;
                        }
                    } else if (j == finalHeight - 1) {
                        if (i == 0) {
                            thisModel = modelLeftTop.copy();
                            thisShape = state.model.shape.left_top;
                        } else if (i == finalWidth - 1) {
                            thisModel = modelRightTop.copy();
                            thisShape = state.model.shape.right_top;
                        } else {
                            thisModel = modelTop.copy();
                            thisShape = state.model.shape.top;
                        }
                    } else {
                        if (i == 0) {
                            thisModel = modelLeft.copy();
                            thisShape = state.model.shape.left;
                        } else if (i == finalWidth - 1) {
                            thisModel = modelRight.copy();
                            thisShape = state.model.shape.right;
                        } else {
                            thisModel = modelCenter.copy();
                            thisShape = state.model.shape.center;
                        }
                    }
                    thisModel.applyTranslation(i * state.model.widthUnit, j * state.model.heightUnit, 0);
                    finalRawModel.append(thisModel);
                    if (thisShape) {
                        thisShape = offsetCollisionBoxes(thisShape, "x", i * state.model.widthUnit * 16);
                        thisShape = offsetCollisionBoxes(thisShape, "y", j * state.model.heightUnit * 16);
                        state.shape = mergeCollisionBoxes(state.shape, thisShape);
                    }
                }
            }
            finalRawModel.applyTranslation(finalWidth * state.model.widthUnit * -0.5 + state.model.widthUnit * 0.5, 0, 0);
            if (state.shape.length > 0) state.shape = offsetCollisionBoxes(state.shape, "x", (finalWidth * state.model.widthUnit * -0.5 + state.model.widthUnit * 0.5) * 16);
            state.dmh.uploadLater(finalRawModel);
            state.model.shape = state.shape;

            let dispRawModel = new RawModel();
            if (state.model.face.front !== undefined) {
                let rawModelBuilder = new RawMeshBuilder(4, "light", Resources.id("fangsu:sign/def_face1.png"));
                let rawModelFront = new RawModel();

                let z = state.model.face.front;
                let finalSlotFront = [
                    [-0.5 * state.model.widthUnit * finalWidth + state.model.bar.left, state.model.heightUnit * finalHeight - state.model.bar.top, z], // 左上 (X左，上点Y/Z)
                    [-0.5 * state.model.widthUnit * finalWidth + state.model.bar.left, state.model.bar.bottom, z], // 左下 (X左，下点Y/Z)
                    [0.5 * state.model.widthUnit * finalWidth - state.model.bar.right, state.model.bar.bottom, z], // 右下 (X右，下点Y/Z)
                    [0.5 * state.model.widthUnit * finalWidth - state.model.bar.right, state.model.heightUnit * finalHeight - state.model.bar.top, z]
                ];

                rawModelBuilder
                    .vertex(finalSlotFront[0][0], finalSlotFront[0][1], finalSlotFront[0][2])
                    .normal(0, 1, 0)
                    .uv(0, 0)
                    .endVertex()
                    .vertex(finalSlotFront[1][0], finalSlotFront[1][1], finalSlotFront[1][2])
                    .normal(0, 1, 0)
                    .uv(0, 1)
                    .endVertex()
                    .vertex(finalSlotFront[2][0], finalSlotFront[2][1], finalSlotFront[2][2])
                    .normal(0, 1, 0)
                    .uv(1, 1)
                    .endVertex()
                    .vertex(finalSlotFront[3][0], finalSlotFront[3][1], finalSlotFront[3][2])
                    .normal(0, 1, 0)
                    .uv(1, 0)
                    .endVertex();
                rawModelFront.append(rawModelBuilder.getMesh());
                if (state.model.offset) rawModelFront.applyTranslation(state.model.offset[0], state.model.offset[1], state.model.offset[2]);
                rawModelFront.generateNormals();
                dispRawModel.append(rawModelFront);
            }
            if (state.model.face.back !== undefined) {
                let rawModelBuilder = new RawMeshBuilder(4, "light", Resources.id("fangsu:sign/def_face1.png"));
                let rawModelBack = new RawModel();

                let z = state.model.face.back;
                let finalSlot = [
                    [0.5 * state.model.widthUnit * finalWidth - state.model.bar.left, state.model.heightUnit * finalHeight - state.model.bar.top, z], // 左上 (X左，上点Y/Z)
                    [0.5 * state.model.widthUnit * finalWidth - state.model.bar.left, state.model.bar.bottom, z], // 左下 (X左，下点Y/Z)
                    [-0.5 * state.model.widthUnit * finalWidth + state.model.bar.right, state.model.bar.bottom, z], // 右下 (X右，下点Y/Z)
                    [-0.5 * state.model.widthUnit * finalWidth + state.model.bar.right, state.model.heightUnit * finalHeight - state.model.bar.top, z]
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
                rawModelBack.append(rawModelBuilder.getMesh());
                if (state.model.offset) rawModelBack.applyTranslation(state.model.offset[0], state.model.offset[1], state.model.offset[2]);
                rawModelBack.generateNormals();
                dispRawModel.append(rawModelBack);
            }
            state.dmhdisp = new DynamicModelHolder();
            state.dmhdisp.uploadLater(dispRawModel);
            texW = 150 * state.width;
            texH = 150 * state.height;
        } else {
            let mainModel = loadRes(res, "model", state.model.model);
            let model = state.model;
            print("[DEBUG] ", JSON.stringify(model));
            let rawModel = mainModel.copy();
            rawModel.sourceLocation = null;
            if (model.flipV) rawModel.applyUVMirror(false, true);
            state.dmh.uploadLater(rawModel);

            let rawModelBuilder = new RawMeshBuilder(4, "light", Resources.id("fangsu:pids/black.png"));
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
            let dispRawModel = new RawModel();
            dispRawModel.append(rawModelBuilder.getMesh());
            dispRawModel.generateNormals();
            state.dmhdisp = new DynamicModelHolder();
            state.dmhdisp.uploadLater(dispRawModel);
            texW = model.texSize[0];
            texH = model.texSize[1];
        }
        let modelInfo = state.model;

        try {
            state.gt.close();
        } catch (e) {}
        state.gt = new GraphicsTexture(texW, texH);

        state.drawScript = String(loadResource("str", modelInfo.script));
        print(String(state.drawScript));
        try {
            state.drawFunction = new Function(`
                ${state.drawScript}
                return draw;
            `)();
            state.drawState = {};
        } catch (e) {
            setErrorInfo("Failed to parse draw function :" + e);
        }

        state.needRef = false;
        state.needRefBox = true;
        state.renderCD = -100;
    }

    if (state.renderCD <= 0) {
        //MinecraftClient.displayMessage("reloading pids..." + String(state.renderCD), false);
        state.renderCD = 0.1;
        let arrivalInfoList = getArrivalInfoList(block, state);
        let extraInfoList = [];
        //print("[DEBUG] arrivalInfoList: " + JSON.stringify(arrivalInfoList));
        state.gt.upload();
        let g = state.gt.graphics;
        let drawInfo = { arrivalInfoList, extraInfoList, texArea: [0, 0, state.gt.width, state.gt.height], ctx, block, entity: block };

        try {
            state.drawFunction(g, state.drawState, drawInfo, state.extraConfig);
            // ctx.setDebugInfo("drawInfo", JSON.stringify(drawInfo));
        } catch (e) {
            setErrorInfo(`Fail to run PIDS script: ${e}`);
        }

        state.gt.upload();
    }

    if (state.dmh.getUploadedModel() != null) {
        ctx.drawModel(state.dmh.getUploadedModel(), null);
    }
    if (state.dmhdisp.getUploadedModel() != null) {
        state.screenModel = state.dmhdisp.getUploadedModel();
        state.screenModel.replaceAllTexture(state.gt.identifier);
        ctx.drawModel(state.screenModel, null);
    }
    state.renderCD -= Timing.delta();

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
                    finalShape = finalShape.concat(rotateCollisionBox(subshape, block.rotateX, block.rotateY, block.rotateZ, block.translateX * 16, block.translateY * 16, block.translateZ * 16));
                }
            // print(finalShape);
            finalShape = collisionBoxArrToStr(finalShape);
            // print(finalShape);
            block.setShape(finalShape);
            block.setCollisionShape(finalShape);
            block.sendUpdateC2S();
            state.needRefBox = false;
        }

    ctx.setDebugInfo("renderCD", state.renderCD);
    ctx.setDebugInfo("mainModel", block.getCustomConfig("mainModel"));
    ctx.setDebugInfo("subModel", block.getCustomConfig("subModel"));
    ctx.setDebugInfo("platformState", block.getCustomConfig("platformState"));
}

function dispose(ctx, state, block) {
    try {
        state.dmh.close();
        state.dmhdisp.close();
        state.gt.close();
    } catch (e) {}
}
function use(ctx, state, block, player) {
    let configs = [];
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", {
            type: "pids",
            defaultVal: block.getCustomConfig("mainModel"),
            showConditition: true
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", { type: "pids", saveKey: "subModel", path: "content", showConditition: true })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.select_plat")), "function", {
            function: () => {
                var cfgSc = buildSelectScreen({ ctx, state, block, entity: block }, false, null);
                drawPlatformSelectScreen(cfgSc);
                MinecraftClient.setScreen(cfgSc);
            }
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.adv.width")), "num", { default: state.width, savePos: "width", showConditition: () => state.model.shouldSpilt })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.adv.height")), "num", { default: state.height, savePos: "height", showConditition: () => state.model.shouldSpilt })
    );
    if (state.model.extraConfig) {
        state.model.extraConfig.forEach((cfg) => {
            let param = cfg.param;
            param.default = state.extraConfig[param.savePos] ? state.extraConfig[param.savePos] : cfg.default;
            configs.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable(cfg.text)), cfg.type, param));
        });
    }

    let sc = createConfigSc(configs, null, { ctx, state, entity: block, block }, { title: ComponentUtil.getString(ComponentUtil.translatable("cfg.title")) });
    displayConfigSc(sc);
}

function getArrivalInfoList(block, state) {
    let pos = block.getWorldPosVector3f();
    let arrivalInfoList = [];
    let platformStateList = state.platformState;
    if (!platformStateList) return [];

    //print("[DEBUG] " + "scheduleList" + JSON.stringify(MTRClientData.SCHEDULES_FOR_PLATFORM));

    for (let platformState of platformStateList) {
        if (!platformState.flag) continue;
        let scheduleList = MTRClientData.SCHEDULES_FOR_PLATFORM;
        let currentSchedule = scheduleList.get(new java.lang.Long(platformState.platformId));
        if (!currentSchedule) continue;
        let currentScheduleList = new java.util.ArrayList(currentSchedule);
        //print("[DEBUG] " + "platformId: " + platformState.platformId + " currentSchedule: " + JSON.stringify(currentScheduleList));
        var iterator = scheduleList.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
        }
        if (!currentScheduleList) continue;
        let scArr = [];
        for (let sc of currentScheduleList) {
            if (sc.routeId == 0) continue;
            let route = getRouteById(String(new java.lang.Long(sc.routeId)));

            let stationNames = [];
            let currentPlatform;
            if (route) {
                let routePlatforms = route.platformIds;
                if (routePlatforms)
                    for (let routePlatform of routePlatforms) {
                        let plat = getPlatformById(String(new java.lang.Long(routePlatform.platformId)));
                        let station = getStationByPlatform(plat);
                        stationNames.push(station.name);
                        if (new java.lang.Long(routePlatform.platformId) == new java.lang.Long(platformState.platformId)) currentPlatform = plat;
                    }
            }
            let destination = getDestinationByRouteId(new java.lang.Long(sc.routeId));
            arrivalInfoList.push({
                arrivalMillis: new java.lang.Long(sc.arrivalMillis),
                trainCars: sc.trainCars,
                route,
                routeId: new java.lang.Long(sc.routeId),
                currentStationIndex: sc.currentStationIndex,
                platformInfo: platformState.platformInfo,
                destination,
                costomDestination: route ? route.getDestination(sc.currentStationIndex) : destination,
                stationNames,
                currentPlatform
            });
        }
        //arrivalInfoList.push(scArr);
    }
    arrivalInfoList.sort((a, b) => a.arrivalMillis - b.arrivalMillis);
    return arrivalInfoList;
}
