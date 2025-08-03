importPackage(java.lang);
importPackage(java.util.concurrent);

/**
 * 获取GtHelper对象
 * @returns GtHelper
 */
function getGtHelper() {
    let gtHelper;
    if (GlobalRegister.containsKey("fangsu_gt_helper")) gtHelper = GlobalRegister.get("fangsu_gt_helper");
    else {
        gtHelper = new GtHelper();
        GlobalRegister.put("fangsu_gt_helper", gtHelper);
    }
    return gtHelper;
}

function getBlockUniqueId(block) {
    let worldPos = block.getWorldPosVector3f();
    return `block_${worldPos.x()}_${worldPos.y()}_${worldPos.z()}`;
}

function GtHelper() {
    this._blockIds = {};
    this._loadGts = {};
    this._maxFps = 10;
    this._pool = Executors.newScheduledThreadPool(1);

    this.isClosed = true;

    this._init();
}

GtHelper.prototype._init = function () {
    this.isClosed = false;
    this._startTicking();
    setDebugInfo("init");
};

GtHelper.prototype._startTicking = function () {
    // if (this._scheduledFuture !== null) {
    //     setDebugInfo("已经在运行定时绘制了.");
    //     return;
    // }

    var delay = 1000 / this._maxFps;

    this._scheduledFuture = this._pool.scheduleAtFixedRate(
        new Runnable({
            run: () => {
                try {
                    this._tick();
                } catch (e) {
                    setDebugInfo("GtHelper: tick 执行出错: " + e);
                }
            }
        }),
        0,
        delay,
        TimeUnit.MILLISECONDS
    );
};

GtHelper.prototype._stopTicking = function () {
    if (this._scheduledFuture !== null) {
        this._scheduledFuture.cancel(false);
        this._scheduledFuture = null;
    }
};

GtHelper.prototype._tick = function () {
    for (let gt_key in this._loadGts) {
        if (this._loadGts.hasOwnProperty(gt_key)) {
            try {
                let gt = this._loadGts[gt_key];
                if (gt._isStatic && gt._available) continue;
                if (gt._isClosed || gt.gt.isClosed()) continue;
                if (gt._waitUntilDraw) {
                    gt._waitUntilDraw = false;
                    continue;
                }
                let gtDetail = gt.getDetailFunction();
                let g = gt.gt.graphics;
                gt.drawFunction(g, gtDetail);
                gt.gt.upload();
                gt._available = true;
                // setDebugInfo(`正在绘制 ${gt_key} ${JSON.stringify(gt)}`);
            } catch (e) {
                setErrorInfo(`在运行绘制时出错 ${e} ( ${e.stack} )`);
            }
        } else setDebugInfo(String(gt_key));
    }
};

/**
 * 添加一个动态贴图
 * @param {BlockEntityEyeCandy} block 装饰物件的BlockEntityEyeCandy
 * @param {Object} drawInfo 绘制的详细内容, 至少包含w和h, 除此之外内容越详细(例如加上绘制脚本名称等)越不容易重复
 * @param {Function} drawFunction 绘制用函数, 接受g和detail对象
 * @param {Function} getDetailFunction 获取绘制信息用函数, 需要输出detail对象
 */
GtHelper.prototype.addDrawGraphic = function (block, drawInfo, drawFunction, getDetailFunction) {
    let blockId = getBlockUniqueId(block);
    let drawInfoId = getShortId(drawInfo);
    if (this._blockIds[blockId]) return;
    else this._blockIds[blockId] = drawInfoId;
    setDebugInfo(`方块 ${blockId} 正在注册 ${drawInfoId} 的绘制!`);
    if (this._loadGts[drawInfoId]) {
        if (!this._loadGts[drawInfoId]._isClosed) {
            // setDebugInfo(`绘制 ${drawInfoId} 正在使用, 当前为 ${JSON.stringify(this._loadGts[drawInfoId])}`);
            if (this._loadGts[drawInfoId].blocks.indexOf(blockId) != -1) return;
            else {
                this._loadGts[drawInfoId].blocks.push(blockId);
                return;
            }
        }
    }
    this._loadGts[drawInfoId] = {
        blocks: [blockId],
        drawFunction,
        getDetailFunction,
        gt: new GraphicsTexture(drawInfo.w, drawInfo.h),
        _available: false,
        _isClosed: false,
        _isStatic: drawInfo.isStatic,
        _waitUntilDraw: drawInfo.waitUntilDraw
    };
    // setDebugInfo(`已创建 ${drawInfoId} 的绘制, 当前为 ${JSON.stringify(this._loadGts[drawInfoId])}`);
};

GtHelper.prototype.removeDrawGraphic = function (block) {
    let blockId = getBlockUniqueId(block);
    let drawInfoId = this._blockIds[blockId];
    let blockIdIndex = this._loadGts[drawInfoId].blocks.indexOf(blockId);
    if (blockIdIndex == -1) setWarnInfo(`无法在 ${drawInfoId} 中找到 ${blockId} 当前为 ${JSON.stringify(this._loadGts[drawInfoId])}`);
    else this._loadGts[drawInfoId].blocks.splice(blockIdIndex);
    setDebugInfo(`方块 ${blockId} 正在注销 ${drawInfoId} 的绘制! 当前为 ${JSON.stringify(this._loadGts[drawInfoId])}`);
    if (this._loadGts[drawInfoId].blocks.length == 0) {
        this._loadGts[drawInfoId].gt.close();
        this._loadGts[drawInfoId]._isClosed = true;
        setDebugInfo(`所有需要 ${drawInfoId} 绘制的方块均已注销, 正在删除...`);
    }
    this._blockIds[blockId] = null;
};

GtHelper.prototype.getBlockGraphics = function (block) {
    let drawInfoId = this._blockIds[getBlockUniqueId(block)];
    if (!drawInfoId) return null;
    let gt = this._loadGts[drawInfoId];
    // if (!gt._available) setDebugInfo(drawInfoId + " " + JSON.stringify(gt));
    if (!gt._available) return null;
    return gt.gt;
};

GtHelper.prototype.setMaxFps = function (fps) {
    this._maxFps = fps;
    this._stopTicking();
    this._startTicking();
};

GtHelper.prototype.dispose = function () {
    try {
        for (let gt_key in this._loadGts) {
            if (this._loadGts.hasOwnProperty(gt_key)) {
                if (gt._isClosed) continue;
                gt.gt.close();
            }
        }
    } finally {
        this._stopTicking();
        if (this._scheduledFuture !== null) {
            this._scheduledFuture.cancel(false);
            this._scheduledFuture = null;
        }

        if (this._pool !== null) {
            this._pool.shutdown();
            this._pool = null;
        }
        this.isClosed = true;
    }
};
