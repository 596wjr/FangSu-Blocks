//script core ver 3.0.2

include(Resources.id("mtrsteamloco:scripts/config_screen.js"));
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));
include(Resources.id("mtrsteamloco:scripts/mtr_util.js"));
include(Resources.id("fangsu:scripts/pzx_helper.js"));
include(Resources.id("fangsu:scripts/costom_item_helper.js"));
include(Resources.id("fangsu:scripts/signsc.js"));
include(Resources.id("fangsu:scripts/mtrselect.js"));
include(Resources.id("fangsu:scripts/config_sc.js"));
importPackage(java.awt);
importPackage(java.awt.geom);

var res = {};

function create(ctx, state, block) {
    state.mainModel = checkConfig(block, "mainModel", "fangsu:adv_board/beijing_adv.json");
    state.cacheMainModel = state.mainModel;
    state.subModel = checkConfig(block, "subModel", "adv_1");
    state.cacheSubModel = state.subModel;
    state.width = checkConfig(block, "width", 3);
    state.cacheWidth = state.width;
    state.height = checkConfig(block, "height", 2);
    state.cacheHeight = state.height;
    state.imgType = checkConfig(block, "imgType", "png");
    state.cacheImgType = state.imgType;
    state.imgPath = checkConfig(block, "imgPath", "");
    state.cacheImgPath = state.imgPath;

    state.rendCd = 0;
    state.shape = [];

    state.dmh = new DynamicModelHolder();
    state.dmhFront = new DynamicModelHolder();
    state.dmhBack = new DynamicModelHolder();

    state.needRef = true;

    state.cacheConfig = {};
    state.config = {};
    state.texLocation = null;
}
function render(ctx, state, block) {
    if (state.config.width) state.width = state.config.width;
    if (state.config.height) state.height = state.config.height;
    if (state.config.imgType) state.imgType = state.config.imgType;
    if (state.config.imgPath) state.imgPath = state.config.imgPath;
    state.config = {};
    if (state.rendCd <= 0) {
        if (
            state.cacheMainModel != block.getCustomConfig("mainModel") ||
            state.cacheSubModel != block.getCustomConfig("subModel") ||
            state.cacheWidth != block.getCustomConfig("width") ||
            state.cacheWidth != state.width ||
            state.cacheHeight != block.getCustomConfig("height") ||
            state.cacheHeight != state.height
        ) {
            state.needRef = true;

            state.mainModel = block.getCustomConfig("mainModel");
            state.cacheMainModel = state.mainModel;
            state.subModel = block.getCustomConfig("subModel");
            state.cacheSubModel = state.subModel;
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
        if (
            state.cacheImgType != block.getCustomConfig("imgType") ||
            state.cacheImgType != state.imgType ||
            state.cacheImgPath != block.getCustomConfig("imgPath") ||
            state.cacheImgPath != state.imgPath
        ) {
            if (state.cacheImgType != block.getCustomConfig("imgType") || state.cacheImgPath != block.getCustomConfig("imgPath")) {
                state.imgType = block.getCustomConfig("imgType");
                state.imgPath = block.getCustomConfig("imgPath");
                state.cacheImgType = state.imgType;
                state.cacheImgPath = state.imgPath;
            }
            if (state.cacheImgType != state.imgType || state.cacheImgPath != state.imgPath) {
                setDebugInfo(`imgType: ${state.imgType} cache: ${state.cacheImgType}`);
                setDebugInfo(`imgPath: ${state.imgPath} cache: ${state.cacheImgPath}`);
                block.putCustomConfig("imgType", state.imgType);
                block.putCustomConfig("imgPath", state.imgPath);
                block.sendUpdateC2S();
                state.cacheImgType = state.imgType;
                state.cacheImgPath = state.imgPath;
            }
            state.needRefTex = true;
        }
    }
    if (state.needRef) {
        let loaded = parseObj(JSON.parse(loadRes(res, "str", state.mainModel)).adv_board);
        if (state.subModel in loaded) state.model = loaded[state.subModel];
        else {
            state.model = JSON.parse(loadRes(res, "str", state.mainModel)).adv_board[0];
            block.putCustomConfig("subModel", state.model.id);
            block.sendUpdateC2S();
        }
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
        ctx.setDebugInfo("model_size", `${finalWidth}x${finalHeight}`);
        ctx.setDebugInfo("mesh_count", finalRawModel.meshList.size());
        finalRawModel.applyTranslation(finalWidth * state.model.widthUnit * -0.5 + state.model.widthUnit * 0.5, 0, 0);
        if (state.shape.length > 0) state.shape = offsetCollisionBoxes(state.shape, "x", (finalWidth * state.model.widthUnit * -0.5 + state.model.widthUnit * 0.5) * 16);
        if (state.model.offset) {
            finalRawModel.applyTranslation(state.model.offset[0], state.model.offset[1], state.model.offset[2]);
            state.shape = offsetCollisionBoxes(state.shape, "x", state.model.offset[0] * 16);
            state.shape = offsetCollisionBoxes(state.shape, "y", state.model.offset[1] * 16);
            state.shape = offsetCollisionBoxes(state.shape, "z", state.model.offset[2] * 16);
        }

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
            state.dmhFront.uploadLater(rawModelFront);
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
            state.dmhBack.uploadLater(rawModelBack);
        }

        state.dmh.uploadLater(finalRawModel);
        //
        if (state.shape.length > 0 && state.shape[0][0]) {
            block.setShape(collisionBoxArrToStr(state.shape));
            block.setCollisionShape(collisionBoxArrToStr(state.shape));
            // setDebugInfo(state.shape);
        } else {
            block.setShape("[0,0,0,16,16,16]");
            block.setCollisionShape("[0,0,0,0,0,0]");
        }
        block.sendUpdateC2S();

        state.needRef = false;
        state.needRefTex = true;
    }
    if (state.needRefTex) {
        if (state.imgType == "png") {
            let location = Resources.id(state.imgPath);
            if (Resources.hasResource(location)) state.texLocation = location;
            else state.texLocation = Resources.id("mtrsteamloco:imgnotfound.png");
        } else if (state.imgType == "web") {
            state.texLocation = loadResource("webImg", state.imgPath);
        }

        state.needRefTex = false;
    }
    if (state.dmh.getUploadedModel()) {
        ctx.drawModel(state.dmh, null);
    }
    if (state.model.face.front !== undefined)
        if (state.dmhFront.getUploadedModel()) {
            if (state.imgType == "png") state.dmhFront.getUploadedModel().replaceAllTexture(state.texLocation);
            else if (state.imgType == "web") {
                if (state.texLocation.is_available()) state.dmhFront.getUploadedModel().replaceAllTexture(state.texLocation.get_texture());
            }

            ctx.drawModel(state.dmhFront, null);
        }
    if (state.model.face.back !== undefined)
        if (state.dmhBack.getUploadedModel()) {
            if (state.imgType == "png") state.dmhBack.getUploadedModel().replaceAllTexture(state.texLocation);
            else if (state.imgType == "web") {
                if (state.texLocation.is_available()) state.dmhBack.getUploadedModel().replaceAllTexture(state.texLocation.get_texture());
            }

            ctx.drawModel(state.dmhBack, null);
        }
    state.rendCd -= Timing.delta();
}

function dispose(ctx, state, block) {
    try {
        state.dmhFront.close();
        state.dmhBack.close();
    } catch (e) {}
}

function use(ctx, state, block, player) {
    let configs = [];
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", {
            type: "adv_board",
            defaultVal: block.getCustomConfig("mainModel"),
            showConditition: true
        })
    );
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", { type: "adv_board", saveKey: "subModel", path: "adv_board", showConditition: true })
    );
    configs.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.adv.width")), "num", { default: state.width, savePos: "width" }));
    configs.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.adv.height")), "num", { default: state.height, savePos: "height" }));
    configs.push(
        buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.adv.type")), "list", {
            default: state.imgType == "png" ? 0 : 1,
            savePos: "imgType",
            listItems: [
                { text: ComponentUtil.getString(ComponentUtil.translatable("cfg.img.png")), val: "png" },
                { text: ComponentUtil.getString(ComponentUtil.translatable("cfg.img.web")), val: "web" }
            ]
        })
    );
    configs.push(buildConfigItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.imgpath")), "str", { default: state.imgPath, savePos: "imgPath", lines: 2 }));

    let sc = createConfigSc(configs, null, { ctx, state, entity: block, block }, { title: ComponentUtil.getString(ComponentUtil.translatable("cfg.title")) });
    displayConfigSc(sc);
}
