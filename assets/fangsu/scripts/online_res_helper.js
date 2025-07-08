// ====================== 网络图片加载器 ======================
/**
 * 网络图片加载器（单例模式）
 * @namespace
 */
var WebImageLoader = (function () {
    /** @private */
    var _instance = {};

    /** @private 图片缓存 */
    _instance.cache = new Map();

    /** @private 下载队列 */
    _instance.pending = new Set();

    /** @private 缓存目录 */
    _instance.cacheDir = new java.io.File("nte_cache/web_images/");
    if (!_instance.cacheDir.exists()) _instance.cacheDir.mkdirs();

    /** @private 线程池 */
    _instance.executor = java.util.concurrent.Executors.newCachedThreadPool();

    /**
     * 加载网络图片
     * @param {string} url - 图片URL
     * @param {function} [callback] - 加载完成回调
     * @returns {WebImg|WebGif} 图片对象
     */
    _instance.load = function (url, callback) {
        // 标准化URL作为缓存键
        var cacheKey = url.toLowerCase().split(/\s+/).join("");

        // 检查缓存
        if (this.cache.has(cacheKey)) {
            var img = this.cache.get(cacheKey);
            if (callback) callback(img);
            return img;
        }

        // 创建占位对象
        var placeholder = url.endsWith(".gif") ?
            new WebGif(url) :
            new WebImg(url);

        // 加入缓存
        this.cache.set(cacheKey, placeholder);

        // 防止重复下载
        if (this.pending.has(cacheKey)) {
            return placeholder;
        }
        this.pending.add(cacheKey);

        // 异步下载
        this.executor.submit(new java.lang.Runnable({
            run: function () {
                try {
                    var startTime = Date.now();

                    // 生成缓存路径
                    var md5 = java.security.MessageDigest.getInstance("MD5");
                    var hashBytes = md5.digest(new java.lang.String(url).getBytes());
                    var hash = new java.math.BigInteger(1, hashBytes).toString(16);
                    var cacheFile = new java.io.File(_instance.cacheDir, hash + ".bin");

                    // 下载文件（如果缓存不存在）
                    if (!cacheFile.exists()) {
                        var conn = new java.net.URL(url).openConnection();
                        conn.setConnectTimeout(3000);

                        var is = conn.getInputStream();
                        var os = new java.io.FileOutputStream(cacheFile);
                        var buffer = java.lang.reflect.Array.newInstance(
                            java.lang.Byte.TYPE, 4096
                        );

                        let bytesRead;
                        while ((bytesRead = is.read(buffer)) !== -1) {
                            os.write(buffer, 0, bytesRead);
                        }
                        os.close();
                        is.close();
                    }

                    // 更新图片对象
                    if (url.endsWith(".gif")) {
                        placeholder._init(cacheFile);
                    } else {
                        placeholder._init(cacheFile);
                    }

                    print(`[INFO] 加载完成: ${url} (${Date.now() - startTime}ms)`);
                } catch (e) {
                    print(`[WARN] 加载失败: ${url} - ${e}`);
                    placeholder._error = e;
                } finally {
                    _instance.pending.delete(cacheKey);
                    if (callback) callback(placeholder);
                }
            }
        }));

        return placeholder;
    };

    return _instance;
})();
// ====================== 网络图片类 ======================
/**
 * 网络图片类
 * @param {string} url - 图片URL
 * @varructor
 */
function WebImg(url) {
    /** @private */
    this._url = url;

    /** @private */
    this._texture = null;

    /** @private */
    this._error = null;

    /** @private */
    this._width = 0;

    /** @private */
    this._height = 0;

    /**
     * 初始化图片（内部使用）
     * @param {java.io.File} file - 缓存文件
     * @private
     */
    this._init = function (file) {
        try {
            var image = javax.imageio.ImageIO.read(file);
            this._width = image.getWidth();
            this._height = image.getHeight();

            this._texture = new GraphicsTexture(this._width, this._height);
            this._texture.graphics.drawImage(image, 0, 0, null);
            this._texture.upload();
        } catch (e) {
            this._error = e;
            print(`[WARN] 创建失败: ${e}`);

            // 使用错误占位图
            var errorImg = Resources.readBufferedImage(
                Resources.id("mtrsteamloco:imgnotfound.png")
            );
            this._texture = new GraphicsTexture(errorImg.getWidth(), errorImg.getHeight());
            this._texture.graphics.drawImage(errorImg, 0, 0, null);
            this._texture.upload();
        }
    };

    /**
     * 检查图片是否可用
     * @returns {boolean} 是否已加载完成
     */
    this.is_available = function () {
        return this._texture !== null && this._error === null;
    };

    /**
     * 获取加载错误信息
     * @returns {Error|null} 错误对象
     */
    this.get_error = function () {
        return this._error;
    };

    /**
     * 获取原始AWT图片对象
     * @returns {java.awt.image.BufferedImage|null} 
     */
    this.get_awt_image = function () {
        return this._texture !== null && this._error === null ? this._texture.bufferedImage : null;
    };

    /**
     * 获取图片宽度
     * @returns {number} 图片宽度（像素）
     */
    this.get_width = function () {
        return this._width;
    };

    /**
     * 获取图片高度
     * @returns {number} 图片高度（像素）
     */
    this.get_height = function () {
        return this._height;
    };

    /**
     * 获取纹理资源标识符
     * @returns {ResourceLocation|null} 纹理资源位置
     */
    this.get_texture = function () {
        return this._texture ? this._texture.identifier : null;
    };

    /**
     * 释放资源
     */
    this.dispose = function () {
        if (this._texture) {
            this._texture.close();
            this._texture = null;
        }
    };
}
// ====================== 网络GIF类 ======================
/**
 * 网络GIF类
 * @param {string} url - GIF URL
 * @varructor
 */
function WebGif(url) {
    /** @private */
    this._url = url;

    /** @private */
    this._player = null;

    /** @private */
    this._error = null;

    /**
     * 初始化GIF（内部使用）
     * @param {java.io.File} file - 缓存文件
     * @private
     */
    this._init = function (file) {
        try {
            this._player = new GifPlayer(file.getAbsolutePath());
        } catch (e) {
            this._error = e;
            print(`[WARN] 创建失败: ${e}`);

            // 使用错误占位GIF
            this._player = new GifPlayer(
                Resources.id("mtrsteamloco:imgnotfound.gif")
            );
        }
    };

    /**
     * 检查GIF是否可用
     * @returns {boolean} 是否已加载完成
     */
    this.is_available = function () {
        return this._player !== null && this._error === null;
    };

    /**
     * 获取加载错误信息
     * @returns {Error|null} 错误对象
     */
    this.get_error = function () {
        return this._error;
    };

    /**
     * 获取当前帧纹理
     * @returns {ResourceLocation|null} 纹理资源位置
     */
    this.get_texture = function () {
        if (!this.is_available()) return null;
        return this._player.get_texture();
    };

    this.get_awt_image = function () {
        return this.getCurrent();
    }

    /**
     * 更新GIF帧
     */
    this.update = function () {
        if (this.is_available()) {
            this._player.update();
        }
    };

    /**
     * 释放资源
     */
    this.dispose = function () {
        if (this._player) {
            this._player.dispose();
            this._player = null;
        }
    };

    // 代理GifPlayer的所有方法
    this.getCurrent = function () {
        return this.is_available() ? this._player.getCurrent() : null;
    };

    this.get_frame = function (index) {
        return this.is_available() ? this._player.get_frame(index) : null;
    };

    this.play = function () {
        if (this.is_available()) this._player.play();
    };

    this.pause = function () {
        if (this.is_available()) this._player.pause();
    };

    this.stop = function () {
        if (this.is_available()) this._player.stop();
    };

    this.get_frame_count = function () {
        return this.is_available() ? this._player.get_frame_count() : 0;
    };

    this.get_width = function () {
        return this.is_available() ? this._player.get_width() : 0;
    };

    this.get_height = function () {
        return this.is_available() ? this._player.get_height() : 0;
    };
}
