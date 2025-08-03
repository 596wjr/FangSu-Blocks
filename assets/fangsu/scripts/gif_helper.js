/**
 * GIF播放器构造函数
 * @param {string} path - GIF资源的资源位置（如"mtrsteamloco:mygif.gif"）
 * @returns {GifPlayer} GIF播放器实例
 */
function GifPlayer(path) {
    // 私有属性
    this._path = path;
    this._frames = [];
    this._delays = [];
    this._totalDuration = 0;
    this._currentFrameIndex = 0;
    this._lastUpdate = Timing.elapsed();
    this._playing = true;
    this._loop = true;
    this._prevComposedFrame = null;
    setDebugInfo(`Loading GIF : ${path}`);
    // 加载GIF
    this._load();
}
/**
 * 加载并解析GIF
 * @private
 */
GifPlayer.prototype._load = function () {
    try {
        var resource = Resources.id(this._path);

        // 获取资源列表
        var resourcesList = UtilitiesClient.getResources(Resources.manager(), resource);

        // 检查资源是否存在
        if (resourcesList.isEmpty()) {
            setErrorInfo(`GIF资源未找到: ${this._path}`);
            this._loadErrorPlaceholder();
            return;
        }

        // 获取第一个资源对象
        var resourceObj = resourcesList.get(0);

        // 获取输入流
        var inputStream = Packages.mtr.mappings.Utilities.getInputStream(resourceObj);
        var imageInputStream = javax.imageio.ImageIO.createImageInputStream(inputStream);
        var readers = javax.imageio.ImageIO.getImageReaders(imageInputStream);

        if (!readers.hasNext()) {
            setErrorInfo("找不到合适的GIF读取器");
            this._loadErrorPlaceholder();
            return;
        }

        var reader = readers.next();
        reader.setInput(imageInputStream);
        var frameCount = reader.getNumImages(true);
        var hasDelayWarning = false; // 标记是否已显示延迟警告

        for (let i = 0; i < frameCount; i++) {
            // 读取帧图像
            var frame = reader.read(i);
            this._frames.push(frame);

            // 读取帧延迟 - 简化处理
            var delay = 100; // 默认100ms延迟
            try {
                var meta = reader.getImageMetadata(i);
                var metaTree = meta.getAsTree("javax_imageio_gif_image_1.0");

                if (metaTree) {
                    var delayNodes = metaTree.getElementsByTagName("delayTime");
                    if (delayNodes && delayNodes.getLength() > 0) {
                        var delayNode = delayNodes.item(0);
                        var delayText = delayNode.getTextContent();
                        if (delayText) {
                            var parsedDelay = parseInt(delayText) * 10; // 转换为毫秒
                            if (!isNaN(parsedDelay)) {
                                delay = parsedDelay;
                            }
                        }
                    } else if (!hasDelayWarning) {
                        // 只显示一次警告
                        setWarnInfo("检测到GIF缺少delayTime节点, 使用默认延迟100ms");
                        hasDelayWarning = true;
                    }
                }
            } catch (e) {
                if (!hasDelayWarning) {
                    setWarnInfo(`读取帧延迟时出错: ${e}，使用默认延迟`);
                    hasDelayWarning = true;
                }
            }

            this._delays.push(delay);
            this._totalDuration += delay;
        }

        reader.dispose();
        inputStream.close();
    } catch (e) {
        setErrorInfo(`GIF加载失败: ${this._path} - ${e}`);
        this._loadErrorPlaceholder();
    } finally {
        // 确保至少有一帧
        if (this._frames.length === 0) {
            this._createBlankFrame();
        }
    }
};

// 加载错误占位图
GifPlayer.prototype._loadErrorPlaceholder = function () {
    this._frames = [Resources.readBufferedImage(Resources.id("mtrsteamloco:imgnotfound.png"))];
    this._delays = [100];
    this._totalDuration = 100;
};

// 创建空白帧
GifPlayer.prototype._createBlankFrame = function () {
    var blankImage = new java.awt.image.BufferedImage(100, 100, java.awt.image.BufferedImage.TYPE_INT_RGB);
    var g = blankImage.createGraphics();
    g.setColor(java.awt.Color.RED);
    g.fillRect(0, 0, 100, 100);
    g.dispose();

    this._frames = [blankImage];
    this._delays = [100];
    this._totalDuration = 100;
};

/**
 * 获取当前时间戳对应的帧
 * @returns {java.awt.image.BufferedImage} 当前帧图像
 */
GifPlayer.prototype.getCurrent = function () {
    if (!this._playing || this._frames.length === 0) {
        return this._frames[0] || this._createBlankFrame();
    }

    // 单帧情况直接返回
    if (this._frames.length === 1) {
        return this._frames[0];
    }
    var now = Timing.elapsed();
    var elapsed = (now - this._lastUpdate) * 1000; // 转换为毫秒
    // 如果超过当前帧延迟，切换到下一帧
    if (elapsed >= this._delays[this._currentFrameIndex]) {
        this._advanceFrame(now);
    }
    // 获取当前帧并处理透明像素
    var currentFrame = this._frames[this._currentFrameIndex];

    // 创建不透明副本（解决透明点问题）
    var opaqueFrame = new java.awt.image.BufferedImage(currentFrame.getWidth(), currentFrame.getHeight(), java.awt.image.BufferedImage.TYPE_INT_ARGB);

    var g = opaqueFrame.createGraphics();

    // 先绘制前一帧作为背景（解决透明点问题）
    if (this._currentFrameIndex > 0 && this._prevComposedFrame) {
        g.drawImage(this._prevComposedFrame, 0, 0, null);
    }

    // 绘制当前帧
    g.drawImage(currentFrame, 0, 0, null);
    g.dispose();

    // 保存为前一帧供下次使用
    this._prevComposedFrame = opaqueFrame;

    return opaqueFrame;
};
GifPlayer.prototype._advanceFrame = function (now) {
    this._lastUpdate = now;

    // 更新帧索引
    this._currentFrameIndex++;

    // 循环处理
    if (this._currentFrameIndex >= this._frames.length) {
        if (this._loop) {
            this._currentFrameIndex = 0;
        } else {
            this._currentFrameIndex = this._frames.length - 1;
            this._playing = false;
        }
    }

    // 重置前一帧缓存（新循环开始时）
    if (this._currentFrameIndex === 0) {
        this._prevComposedFrame = null;
    }
};
/**
 * 获取特定索引的帧
 * @param {number} index - 帧索引（0-based）
 * @returns {java.awt.image.BufferedImage} 指定帧图像
 */
GifPlayer.prototype.getFrame = function (index) {
    return this._frames[Math.min(index, this._frames.length - 1)];
};
/**
 * 获取特定时间点的帧
 * @param {number} timeMs - 从GIF开始的时间（毫秒）
 * @returns {java.awt.image.BufferedImage} 时间点对应的帧
 */
GifPlayer.prototype.getFrameAtTime = function (timeMs) {
    if (this._frames.length <= 1) return this._frames[0];

    var loopTime = this._loop ? timeMs % this._totalDuration : timeMs;
    let accumulated = 0;

    for (let i = 0; i < this._delays.length; i++) {
        accumulated += this._delays[i];
        if (loopTime < accumulated) {
            return this._frames[i];
        }
    }
    return this._loop ? this._frames[0] : this._frames[this._frames.length - 1];
};
/**
 * 播放GIF
 */
GifPlayer.prototype.play = function () {
    this._playing = true;
    this._lastUpdate = Timing.elapsed();
};
/**
 * 暂停GIF
 */
GifPlayer.prototype.pause = function () {
    this._playing = false;
};
/**
 * 停止并重置GIF
 */
GifPlayer.prototype.stop = function () {
    this._playing = false;
    this._currentFrameIndex = 0;
};
/**
 * 设置循环模式
 * @param {boolean} loop - 是否循环播放
 */
GifPlayer.prototype.setLoop = function (loop) {
    this._loop = loop;
};
/**
 * 获取帧数量
 * @returns {number} 总帧数
 */
GifPlayer.prototype.getFrameCount = function () {
    return this._frames.length;
};
/**
 * 获取GIF宽度
 * @returns {number} 图像宽度（像素）
 */
GifPlayer.prototype.getWidth = function () {
    return this._frames[0].getWidth() || 0;
};
/**
 * 获取GIF高度
 * @returns {number} 图像高度（像素）
 */
GifPlayer.prototype.getHeight = function () {
    return this._frames[0].getHeight() || 0;
};
/**
 * 获取总时长
 * @returns {number} GIF总时长（毫秒）
 */
GifPlayer.prototype.getDuration = function () {
    return this._totalDuration;
};
/**
 * 获取当前帧索引
 * @returns {number} 当前帧索引
 */
GifPlayer.prototype.getCurrentFrameIndex = function () {
    return this._currentFrameIndex;
};
/**
 * 是否正在播放
 * @returns {boolean} 播放状态
 */
GifPlayer.prototype.isPlaying = function () {
    return this._playing;
};

/**
 * 在GifPlayer原型上添加纹理获取方法
 */
GifPlayer.prototype.get_texture = function () {
    if (!this._texture) {
        // 延迟创建纹理
        var frame = this.getCurrent();
        this._texture = new GraphicsTexture(frame.getWidth(), frame.getHeight());
        this._texture.graphics.drawImage(frame, 0, 0, null);
        this._texture.upload();
    }
    return this._texture.identifier;
};
/**
 * 在GifPlayer原型上添加更新方法
 */
GifPlayer.prototype.update = function () {
    var frame = this.getCurrent();

    // 重用纹理对象
    if (!this._texture) {
        this._texture = new GraphicsTexture(frame.getWidth(), frame.getHeight());
    }

    // 更新帧内容
    this._texture.graphics.clearRect(0, 0, this._texture.graphics.getWidth(), this._texture.graphics.getHeight());
    this._texture.graphics.drawImage(frame, 0, 0, null);
    this._texture.upload();
};
/**
 * 在GifPlayer原型上添加释放方法
 */
GifPlayer.prototype.dispose = function () {
    if (this._texture) {
        this._texture.close();
        this._texture = null;
    }
    // 释放原始GIF资源
    if (this._frames) {
        this._frames = null;
    }
};
