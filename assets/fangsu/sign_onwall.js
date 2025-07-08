//script core ver 3.0.2

include(Resources.id("mtrsteamloco:scripts/config_screen.js"));
include(Resources.id("mtrsteamloco:scripts/color_util.js"));
include(Resources.id("mtrsteamloco:scripts/js_util.js"));
include(Resources.id("mtrsteamloco:scripts/mtr_util.js"));
include(Resources.id("fangsu:scripts/pzx_helper.js"));
include(Resources.id("fangsu:scripts/costom_item_helper.js"));
include(Resources.id("fangsu:scripts/signsc.js"));
include(Resources.id("fangsu:scripts/config_sc.js"));
include(Resources.id("fangsu:scripts/mtrselect.js"));
importPackage(java.awt);
importPackage(java.awt.geom);

var res = {}

function create(ctx, state, block) {
    state.mainModel = checkConfig(block, "mainModel", "fangsu:sign/beijing/beijing_sign.json");
    state.cacheMainModel = state.mainModel;
    state.subModel = checkConfig(block, "subModel", "beijing_sign_a");
    state.cacheSubModel = state.subModel;
    state.length = checkConfig(block, "length", 2);
    state.cacheLength = state.length;
    state.dispCfg = checkConfig(block, "dispItems", JSON.stringify({ front: [[], [], []] }));
    state.disp = JSON.parse(state.dispCfg);
    state.cacheDispCfg = state.dispCfg;
    state.rendCd = 0;
    state.shape = [];

    state.dmh = new DynamicModelHolder();
    state.dmhFront = new DynamicModelHolder();

    state.needRef = true;

}
function render(ctx, state, block) {
    if (state.rendCd <= 0) {
        if (state.cacheMainModel != block.getCustomConfig("mainModel") || state.cacheSubModel != block.getCustomConfig("subModel") ||
            state.cacheLength != block.getCustomConfig("length") || state.cacheLength != state.length) {
            state.needRef = true;

            state.mainModel = block.getCustomConfig("mainModel");
            state.cacheMainModel = state.mainModel;
            state.subModel = block.getCustomConfig("subModel");
            state.cacheSubModel = state.subModel;
            if (state.cacheLength != state.length) {
                block.putCustomConfig("length", state.length);
                print("[DEBUG] @ signp.js : ", "length", " update to : ", state.length); block.sendUpdateC2S();
                state.cacheLength = state.length;
            } else {
                state.length = block.getCustomConfig("length");
                state.cacheLength = state.length;
            }
            // print(
            //     `配置变更检测：
            //     主模型 [${state.cacheMainModel || "空"}] → [${block.getCustomConfig("mainModel")}]
            //     子模型 [${state.cacheSubModel || "空"}] → [${block.getCustomConfig("subModel")}]
            //     长度 [${state.cacheLength || "空"}] → [${block.getCustomConfig("length")}]
            //     杆配置 [${state.cachePoleInfo || "空"}] → [${block.getCustomConfig("poleInfo")}]`
            // );
        }

    }
    if (state.needRef) {
        let loaded = parseObj(JSON.parse(loadRes(res, "str", state.mainModel)).on_wall);
        if (state.subModel in loaded)
            state.model = loaded[state.subModel];
        else {
            state.model = (JSON.parse(loadRes(res, "str", state.mainModel))).on_wall[0];
            block.putCustomConfig("subModel", state.model.id);
            block.sendUpdateC2S();
        }
        state.shape = [];

        let model = loadRes(res, "partedModel", state.model.model);
        let modelLeft = model.get(state.model.side.left.subModel).copy();
        modelLeft.sourceLocation = null;
        if (state.model.flipV) modelLeft.applyUVMirror(false, true);
        let modelRight = model.get(state.model.side.right.subModel).copy();
        modelRight.sourceLocation = null;
        if (state.model.flipV) modelRight.applyUVMirror(false, true);
        let modelMain = model.get(state.model.main.subModel).copy();
        modelMain.sourceLocation = null;
        if (state.model.flipV) modelMain.applyUVMirror(false, true);



        let finalRawModel = new RawModel();
        modelMain.applyTranslation(-0.5 * state.model.unit * state.length / 16 + 0.25, 0, 0);
        modelLeft.applyTranslation(-0.5 * state.model.unit * state.length / 16, 0, 0);
        modelRight.applyTranslation(0.5 * state.model.unit * state.length / 16, 0, 0);
        finalRawModel.append(modelLeft);
        finalRawModel.append(modelRight);
        for (let i = 0; i < state.length; i++) {
            state.shape = mergeCollisionBoxes(state.shape, offsetCollisionBoxes(state.model.main.shape, 'x', Number(state.model.unit) * i - 0.5 * state.model.unit * state.length + 4));
            finalRawModel.append(modelMain.copy());
            modelMain.applyTranslation(state.model.unit / 16, 0, 0);
        }


        let rawModelBuilder = new RawMeshBuilder(4, "light", Resources.id("fangsu:sign/def_face1.png"));
        let rawModelFront = new RawModel();

        let [y1, z1] = state.model.tex[0];
        let [y2, z2] = state.model.tex[1]
        let finalSlotFront = [
            [-0.5 * state.model.unit * state.length / 16, y2, z2],  // 左上 (X左，上点Y/Z)
            [-0.5 * state.model.unit * state.length / 16, y1, z1],  // 左下 (X左，下点Y/Z)
            [0.5 * state.model.unit * state.length / 16, y1, z1], // 右下 (X右，下点Y/Z)
            [0.5 * state.model.unit * state.length / 16, y2, z2]];

        rawModelBuilder
            .vertex(finalSlotFront[0][0], finalSlotFront[0][1], finalSlotFront[0][2]).normal(0, 1, 0).uv(0, 0).endVertex()
            .vertex(finalSlotFront[1][0], finalSlotFront[1][1], finalSlotFront[1][2]).normal(0, 1, 0).uv(0, 1).endVertex()
            .vertex(finalSlotFront[2][0], finalSlotFront[2][1], finalSlotFront[2][2]).normal(0, 1, 0).uv(1, 1).endVertex()
            .vertex(finalSlotFront[3][0], finalSlotFront[3][1], finalSlotFront[3][2]).normal(0, 1, 0).uv(1, 0).endVertex();
        rawModelFront.append(rawModelBuilder.getMesh());
        rawModelFront.generateNormals();


        state.dmh.uploadLater(finalRawModel);
        state.dmhFront.uploadLater(rawModelFront);

        block.setShape(collisionBoxArrToStr(state.shape));
        block.setCollisionShape(collisionBoxArrToStr(state.shape));

        state.needRef = false; state.needRefTex = true;
    }
    if (state.needRefTex) {
        state.dispCfg = block.getCustomConfig("dispItems");
        state.disp = JSON.parse(state.dispCfg);
        state.cacheDispCfg = state.dispCfg;

        if (state.gtFront) state.gtFront.close();

        state.gtFront = new GraphicsTexture(state.model.unit * 72 * state.length + 1, state.model.unit * 72 + 1);

        let drawItems;
        let g;

        //front
        g = state.gtFront.graphics;
        g.setColor(Color.BLACK);
        g.fillRect(0, 0, state.model.unit * 72 * state.length, state.model.unit * 72);
        //left
        drawItems = parseDrawDetail(g, state.disp.front[0]);
        g.setColor(Color.WHITE);
        drawSignItems(g, res, drawItems, 0, 0, state.model.unit * 10, state.model.unit * 48);
        //center
        drawItems = parseDrawDetail(g, state.disp.front[1]);
        var finalWidth = (0.1 * (drawItems.length - 1) + (drawItems.reduce((total, item) => total + item.width, 0))) * state.model.unit * 48;
        drawSignItems(g, res, drawItems, 1, state.model.unit * 72 * state.length * 0.5 - finalWidth * 0.5, state.model.unit * 10, state.model.unit * 48);
        //right
        drawItems = parseDrawDetail(g, state.disp.front[2]);
        var finalWidth = (0.1 * (drawItems.length - 1) + (drawItems.reduce((total, item) => total + item.width, 0))) * state.model.unit;
        drawSignItems(g, res, drawItems, 2, state.model.unit * 72 * state.length, state.model.unit * 10, state.model.unit * 48);



        state.gtFront.upload();

        ctx.setDebugInfo("front", state.gtFront);

        state.needRefTex = false;
    }
    if (state.dmh.getUploadedModel()) {
        ctx.drawModel(state.dmh.getUploadedModel(), null);
    }
    if (state.dmhFront.getUploadedModel()) {
        state.dmhFront.getUploadedModel().replaceAllTexture(state.gtFront.identifier);
        ctx.drawModel(state.dmhFront.getUploadedModel(), null);
    }

    state.rendCd -= Timing.delta();
}

function dispose(ctx, state, block) {
    try {
        state.dmh.close();
        state.dmhFront.close();

        state.gtFront.close();
    } catch (e) { }
}

function use(ctx, state, block, player) {
    let configs = [];
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.mainmodel")), "mainModel", { type: "sign", defaultVal: block.getCustomConfig("mainModel") }));
    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.content.submodel")), "subModel", { type: "sign", saveKey: "subModel", path: "on_wall" }));

    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.length")), "num", { val: state.length, isInt: true, min: 0, max: 30, save: "length" }));


    configs.push(buildCfgItem(ComponentUtil.getString(ComponentUtil.translatable("cfg.sign.open_gui")), "function",
        "MinecraftClient.setScreen(buildSignScreen(screen.state.eyecandy));"));
    let sc = createConfigScreen(configs, null, { ctx, state, entity: block, block });
    displayConfigScreen(sc);
}