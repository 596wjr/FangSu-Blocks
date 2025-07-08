//script core ver 3.0.1

include(Resources.id("mtrsteamloco:scripts/config_screen.js"));
include(Resources.id("fangsu:scripts/pzx_helper.js"));
importPackage(java.awt);
importPackage(java.awt.geom);

var res = {}

function create(ctx, state, block) {
    if (!block.getCustomConfig("mainModel")) {
        block.putCustomConfig("mainModel", "fangsu:screendoor/bj/bg1.json");
        block.sendUpdateC2S();
    }
    if (!block.getCustomConfig("subModel")) {
        block.putCustomConfig("subModel", "common");
        block.sendUpdateC2S();
    }
    state.dmh = [];
    state.doorVal = block.doorTarget ? 1 : 0;
    state.isLeft = block.getCustomConfig("isLeft") == "true";
    state.cacheIsLeft = state.isLeft;
    state.cacheMainMod = block.getCustomConfig("mainModel");
    state.cacheSubMod = block.getCustomConfig("subModel");
    state.needRef = true;
    state.needRefBox = true;
    state.cacheMat = {}
}

function render(ctx, state, block) {
    if (state.cacheMainMod != block.getCustomConfig("mainModel") || state.cacheSubMod != block.getCustomConfig("subModel")) {
        state.needRef = true;
    }
    if (state.isLeft != state.cacheIsLeft) {
        state.needRef = true;
        state.cacheIsLeft = state.isLeft;
        block.putCustomConfig("isLeft", state.isLeft ? "true" : "false");
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

    if (state.needRef) {
        try {
            for (let dm of state.dmh) dm.close();
        } catch (e) { }

        state.cacheMainMod = block.getCustomConfig("mainModel");
        state.cacheSubMod = block.getCustomConfig("subModel");

        let loaded = parseObj((JSON.parse(loadRes(res, "str", state.cacheMainMod))).door[state.isLeft ? "left" : "right"]);
        if (state.cacheSubMod in loaded)
            state.model = loaded[state.cacheSubMod];
        else {
            state.model = (JSON.parse(loadRes(res, "str", state.cacheMainMod))).door[state.isLeft ? "left" : "right"][0];
            block.putCustomConfig("subModel", state.model.key);
            block.sendUpdateC2S();
        }

        let mainModel = (loadRes(res, "partedModel", JSON.parse(loadRes(res, "str", state.cacheMainMod)).model));
        // print(JSON.stringify(mainModel))
        for (let i = 0; i < state.model.doors.length; i++) {
            let door = state.model.doors[i];
            // print("[DEBUG] ", door.subModel)
            let rawModel = mainModel.get(door.subModel).copy();
            rawModel.sourceLocation = null;
            if (state.model.flipV) rawModel.applyUVMirror(false, true);
            state.dmh[i] = new DynamicModelHolder();
            state.dmh[i].uploadLater(rawModel);
        }
        state.needRef = false;
        state.needRefBox = true;
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
    for (let i = 0; i < state.model.doors.length; i++) {
        let door = state.model.doors[i];
        if (state.dmh[i].getUploadedModel()) {
            if (shape != "" && door.shape) shape += "/"
            if (door.shape) shape += getShape(door.shape, state.doorVal, door.step);
            let mat = new Matrices();
            mat.translate(-1 * state.doorVal * parseFloat(door.step), 0, 0);
            ctx.drawModel(state.dmh[i].getUploadedModel(), mat);
        }
    }

    if (shape == "") shape = "0,0,0,16,16,16"
    if (state.cacheShape != shape || state.needRefBox == true) {
        state.cacheShape = shape;
        let finalShape = [];
        if (shape == "0,0,0,16,16,16") { finalShape = [[0, 0, 0, 16, 16, 16]] }
        else
            for (let subshape of collisionBoxStrToArr(shape)) {
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

    ctx.setDebugInfo("mainModel", block.getCustomConfig("mainModel"));
    ctx.setDebugInfo("isLeft", state.isLeft);
}

function dispose(ctx, state, block) {
    try {
        state.dynamicModelHolder.close();
    } catch (e) { }

}
function use(ctx, state, block, player) {


    let configs = [];
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", { type: "screendoor", defaultVal: block.getCustomConfig("mainModel") }));
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", { type: "screendoor", path: "door." + (state.isLeft ? "left" : "right") }));
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.screendoor.is_left")), "bool", { val: state.isLeft, save: "isLeft", style: 2 }));
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
