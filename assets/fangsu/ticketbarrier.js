include(Resources.id("mtrsteamloco:scripts/config_screen.js"));

importPackage(java.awt);

var res = {};
function create(ctx, state, block) {
    state.cacheIsOpened = block.isOpened();
    state.dmhMain = null;
    state.dmhDoor = {};
    state.doorAngle = block.isOpened() ? 0 : 1;
    state.closeDelay = 0;
    if (!block.getCustomConfig("mainModel")) {
        block.putCustomConfig("mainModel", "fangsu:ticketbarrier/beijing_barrier.json");
        block.sendUpdateC2S();
    }
    if (!block.getCustomConfig("subModel")) {
        block.putCustomConfig("subModel", "beijing1");
        block.sendUpdateC2S();
    }
    state.cacheMainMod = block.getCustomConfig("mainModel");
    state.cacheSubMod = block.getCustomConfig("subModel");
    state.needRef = true;
}
function render(ctx, state, block) {
    if (state.cacheMainMod != block.getCustomConfig("mainModel") || state.cacheSubMod != block.getCustomConfig("subModel")) {
        // MinecraftClient.displayMessage("need refresh|||main=" + String(block.getCustomConfig("mainModel")) + "|||cache=" + String(state.cacheMainMod) + "|||sub=" + String(block.getCustomConfig("subModel")) + "|||cache=" + String(state.cacheSubMod), false)
        state.needRef = true;
    }
    if (state.needRef) {
        try {
            state.dmhMain.close();
            for (let dmh of state.dmhDoor) dmh.close();
        } catch (e) {}

        state.cacheMainMod = block.getCustomConfig("mainModel");
        state.cacheSubMod = block.getCustomConfig("subModel");
        //print(JSON.parse(loadRes(res, "str", state.cacheMainMod))[state.cacheSubMod]);

        let loaded = parseObj(JSON.parse(loadRes(res, "str", state.cacheMainMod)).content);
        if (state.cacheSubMod in loaded) state.model = loaded[state.cacheSubMod];
        else {
            state.model = JSON.parse(loadRes(res, "str", state.cacheMainMod)).content[0];
            block.putCustomConfig("subModel", state.model.key);
            block.sendUpdateC2S();
        }
        //print(JSON.stringify(state.model));

        let mainModel = loadRes(res, "model", state.model.model).copy();
        mainModel.sourceLocation = null;
        if (state.model.flipV) mainModel.applyUVMirror(false, true);
        state.dmhMain = new DynamicModelHolder();
        state.dmhMain.uploadLater(mainModel);
        if (state.model.open_model) {
            let openModel = loadRes(res, "model", state.model.open_model).copy();
            openModel.sourceLocation = null;
            if (state.model.flipV) openModel.applyUVMirror(false, true);
            state.dmhOpen = new DynamicModelHolder();
            state.dmhOpen.uploadLater(openModel);
        }
        if (state.model.doors) {
            for (let i = 0; i < state.model.doors.length; i++) {
                let door = state.model.doors[i];
                let doorModel;
                if (door.use_parted_model) {
                    doorModel = loadRes(res, "partedModel", door.model);
                    state.dmhDoor[i] = {};
                    for (let doorInfo of door.pos) {
                        let thisModel = doorModel.get(doorInfo.subModel).copy();
                        thisModel.sourceLocation = null;
                        if (door.flipV) thisModel.applyUVMirror(false, true);
                        if (!state.dmhDoor[i][doorInfo.subModel]) {
                            state.dmhDoor[i][doorInfo.subModel] = new DynamicModelHolder();
                            state.dmhDoor[i][doorInfo.subModel].uploadLater(thisModel);
                        }
                    }
                } else {
                    doorModel = loadRes(res, "model", door.model).copy();
                    doorModel.sourceLocation = null;
                    if (door.flipV) doorModel.applyUVMirror(false, true);
                    state.dmhDoor[i] = new DynamicModelHolder();
                    state.dmhDoor[i].uploadLater(doorModel);
                }
            }
        }

        state.needRef = false;
    }

    if (block.isOpened()) {
        block.setCollisionShape("-1, 0, 0, 1, 24, 16/ 15, 0, 0, 17, 24 ,16");
        if (state.doorAngle > 0) {
            state.doorAngle -= Timing.delta() * 8;
        }
        if (state.doorAngle <= 0) state.doorAngle = 0;
        state.closeDelay = 0.5;

        if (state.model.open_model) {
            let openModel = state.dmhOpen.getUploadedModel();
            if (openModel) ctx.drawModel(openModel, null);
        }
    } else {
        block.setCollisionShape("-1, 0, 0, 1, 24, 16/ 15, 0, 0, 17, 24 ,16/ 1, 0, 12, 15,24,15");
        state.closeDelay -= Timing.delta();
        if (state.closeDelay <= 0) {
            if (state.doorAngle < 1) {
                state.doorAngle += Timing.delta() * 8;
            }
            if (state.doorAngle >= 1) state.doorAngle = 1;
            state.closeDelay = 0;
        } else {
            state.doorAngle -= Timing.delta() * 8;
            if (state.doorAngle <= 0) state.doorAngle = 0;
        }
    }
    if (state.cacheIsOpened != block.isOpened()) block.sendUpdateC2S();
    state.cacheIsOpened = block.isOpened();

    if (state.dmhMain.getUploadedModel()) {
        ctx.drawModel(state.dmhMain.getUploadedModel(), null);
    }
    if (state.model.doors) {
        for (let i = 0; i < state.model.doors.length; i++) {
            if (state.model.doors[i].use_parted_model) {
                let doorModelList = state.dmhDoor[i];

                let door = state.model.doors[i];
                for (let doorInfo of door.pos) {
                    let doorModel = doorModelList[doorInfo.subModel];
                    if (doorModel) {
                        let mat = new Matrices();
                        mat.translate(doorInfo.pos[0], doorInfo.pos[1], doorInfo.pos[2]);
                        if (door.doorType == 1) {
                            if (doorInfo.side == 0) mat.rotateZ(doorInfo.step * state.doorAngle * Math.PI);
                        }
                        if (door.doorType == 2) {
                            if (doorInfo.side == 0) mat.rotateY(0.5 * state.doorAngle * Math.PI);
                            else if (doorInfo.side == 1) mat.rotateY(0.5 * state.doorAngle * Math.PI * -1);
                        }
                        ctx.drawModel(doorModel, mat);
                    }
                }
            } else {
                let doorModel = state.dmhDoor[i].getUploadedModel();
                if (doorModel) {
                    let door = state.model.doors[i];
                    for (let doorInfo of door.pos) {
                        let mat = new Matrices();
                        mat.translate(doorInfo.pos[0], doorInfo.pos[1], doorInfo.pos[2]);
                        if (door.doorType == 2) {
                            if (doorInfo.side == 0) mat.rotateY(0.5 * state.doorAngle * Math.PI);
                            else if (doorInfo.side == 1) mat.rotateY(0.5 * state.doorAngle * Math.PI * -1);
                        }
                        ctx.drawModel(doorModel, mat);
                    }
                }
            }
        }
    }
}
function dispose(ctx, state, block) {}
function use(ctx, state, block, player) {
    let configs = [];
    print(block.getCustomConfig("mainModel"));
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", { type: "ticketBarrier", defaultVal: block.getCustomConfig("mainModel") }));
    configs.push(
        buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", { type: "ticketBarrier", path: "content", defaultVal: block.getCustomConfig("subModel") })
    );
    //configs.push(buildCfgItem("fc", "function", "MinecraftClient.displayMessage(\"Hello World!\",false)"));
    let sc = createConfigScreen(configs, null, { ctx, state, block });
    displayConfigScreen(sc);
}
