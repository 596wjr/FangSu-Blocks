//script core ver 3.0

include(Resources.id("mtrsteamloco:scripts/config_screen.js"));
importPackage(java.awt);
importPackage(java.awt.geom);

var res = {}

function create(ctx, state, block) {
    if (!block.getCustomConfig("mainModel")) {
        block.putCustomConfig("mainModel", "fangsu:screendoor/bj/bg1.json");
        block.sendUpdateC2S();
    }
    if (!block.getCustomConfig("subModelLeft")) {
        block.putCustomConfig("subModelLeft", "glassend");
        block.sendUpdateC2S();
    }
    if (!block.getCustomConfig("subModelRight")) {
        block.putCustomConfig("subModelRight", "glassend");
        block.sendUpdateC2S();
    }
    // state.dmhL = [];
    // state.dmhR = [];
    state.doorVal = block.doorTarget ? 1 : 0;
    state.cacheMainMod = block.getCustomConfig("mainModel");
    state.cacheSubModLeft = block.getCustomConfig("subModelLeft");
    state.cacheSubModRight = block.getCustomConfig("subModelRight");
    state.needRef = true;
}

function render(ctx, state, block) {
    if (state.cacheMainMod != block.getCustomConfig("mainModel") || state.cacheSubModLeft != block.getCustomConfig("subModelLeft") || state.cacheSubModRight != block.getCustomConfig("subModelRight")) {
        state.needRef = true;
    }

    if (state.needRef) {
        try {
            for (let dm of state.dmhL) dm.close();
            for (let dm of state.dmhR) dm.close();
        } catch (e) { }

        state.cacheMainMod = block.getCustomConfig("mainModel");
        state.cacheSubModLeft = block.getCustomConfig("subModelLeft");
        state.cacheSubModRight = block.getCustomConfig("subModelRight");

        let loadedLeft = parseObj((JSON.parse(loadRes(res, "str", state.cacheMainMod))).glass.left);
        let loadedRight = parseObj((JSON.parse(loadRes(res, "str", state.cacheMainMod))).glass.right);
        if (state.cacheSubModLeft in loadedLeft)
            state.modelLeft = loadedLeft[state.cacheSubModLeft];
        else {
            state.modelLeft = (JSON.parse(loadRes(res, "str", state.cacheMainMod))).glass.left[0];
            block.putCustomConfig("subModelLeft", state.modelLeft.key);
            block.sendUpdateC2S();
        }
        if (state.cacheSubModRight in loadedRight)
            state.modelRight = loadedRight[state.cacheSubModRight];
        else {
            state.modelRight = (JSON.parse(loadRes(res, "str", state.cacheMainMod))).glass.right[0];
            block.putCustomConfig("subModelRight", state.modelRight.key);
            block.sendUpdateC2S();
        }

        let mainModel = (loadRes(res, "partedModel", JSON.parse(loadRes(res, "str", state.cacheMainMod)).model));
        // print(JSON.stringify(mainModel));
        // print(JSON.stringify(loadedLeft))
        // print(JSON.stringify(state.modelLeft))
        // for (let i = 0; i < state.model.doors.length; i++) {
        // let door = state.model.doors[i];
        // print("[DEBUG] ", door.subModel)
        let modelLeft = state.modelLeft;
        let modelRight = state.modelRight;
        let rawModelLeft = mainModel.get(modelLeft.subModel).copy();
        rawModelLeft.sourceLocation = null;
        if ((JSON.parse(loadRes(res, "str", state.cacheMainMod))).flipV) rawModelLeft.applyUVMirror(false, true);
        state.dmhL = new DynamicModelHolder();
        state.dmhL.uploadLater(rawModelLeft);

        let rawModelRight = mainModel.get(modelRight.subModel).copy();
        rawModelRight.sourceLocation = null;
        if ((JSON.parse(loadRes(res, "str", state.cacheMainMod))).flipV) rawModelRight.applyUVMirror(false, true);
        state.dmhR = new DynamicModelHolder();
        state.dmhR.uploadLater(rawModelRight);
        // }
        state.needRef = false
    }

    if (block.doorTarget || block.doorValue >= 0.6) {
        state.doorVal += (Timing.delta() * 0.6);
        if (state.doorVal >= 1) state.doorVal = 1;
    }
    else {
        state.doorVal -= (Timing.delta() * 0.6);
        if (state.doorVal <= 0) state.doorVal = 0;
    }

    let shape = "";
    // for (let i = 0; i < state.model.doors.length; i++) {
    //     let door = state.model.doors[i];
    if (state.dmhL.getUploadedModel()) {
        if (state.modelLeft.shape) shape += getShape(state.modelLeft.shape, 0, 0);
        ctx.drawModel(state.dmhL.getUploadedModel(), null);
        if (state.modelLeft.script) {
            try {
                for (let script of state.modelLeft.script) {
                    eval(script.scriptText + loadRes(res, "str", script.scriptFile));
                }
            } catch (e) { print("[ERROR] in screendoor script (left) :" + e) }
        }
    }
    if (state.dmhR.getUploadedModel()) {
        if (shape != "" && state.modelRight.shape) shape += "/"
        if (state.modelRight.shape) shape += getShape(state.modelRight.shape, 0, 0);
        ctx.drawModel(state.dmhR.getUploadedModel(), null);
        if (state.modelRight.script) {
            try {
                for (let script of state.modelRight.script) {
                    eval(script.scriptText + loadRes(res, "str", script.scriptFile));
                }
            } catch (e) { print("[ERROR] in screendoor script (right) :" + e) }
        }
    }
    // }

    if (shape == "") shape = "0,0,0,16,16,16"
    if (state.cacheShape != shape) {
        state.cacheShape = shape
        block.setShape(shape);
        block.setCollisionShape(shape);
        block.sendUpdateC2S();
    }

    ctx.setDebugInfo("mainModel", block.getCustomConfig("mainModel"));
    ctx.setDebugInfo("subModelLeft", block.getCustomConfig("subModelLeft"));
    ctx.setDebugInfo("subModelRight", block.getCustomConfig("subModelRight"));

}

function dispose(ctx, state, block) {
    try {
        state.dynamicModelHolder.close();
    } catch (e) { }

}
function use(ctx, state, block, player) {


    let configs = [];
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", { type: "screendoor", defaultVal: block.getCustomConfig("mainModel") }));
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel_left")), "subModel", { type: "screendoor", saveKey: "subModelLeft", path: "glass.left" }));
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel_right")), "subModel", { type: "screendoor", saveKey: "subModelRight", path: "glass.right" }));
    let sc = createConfigScreen(configs, null, { ctx, state, block });
    displayConfigScreen(sc);


}

function getShape(rawShape, doorVal, step) {
    let finalShape = "";
    for (let rs of rawShape) {
        if (finalShape != "") finalShape += "/"
        for (let i = 0; i < 6; i++) {
            if (i == 0 || i == 3) {
                finalShape += (rs[i] + parseFloat(doorVal * step * 16)).toFixed(1);
            }
            else {
                finalShape += (rs[i]).toFixed(1);
            }
            if (i != 5) finalShape += ",";
        }
    }
    return finalShape;
}
