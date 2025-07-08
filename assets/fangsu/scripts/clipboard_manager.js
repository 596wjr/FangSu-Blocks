// 导入必要的GLFW和内存管理类
importPackage(org.lwjgl.glfw);
importPackage(org.lwjgl);
importPackage(com.google.common.base);

// 全局剪贴板缓冲区（8KB容量）
var clipboardScratchBuffer = BufferUtils.createByteBuffer(8192);

/**
 * 获取系统剪贴板内容
 * @returns {string} 剪贴板文本内容
 */
function getClipboard() {
    let windowHandle = 0;
    // 保存并临时替换错误回调
    var originalErrorCallback = GLFW.glfwSetErrorCallback(null);

    try {
        // 获取剪贴板内容（自动处理活动窗口）
        let clipboardText = GLFW.glfwGetClipboardString(windowHandle);
        return clipboardText || "";
    } finally {
        // 恢复原始错误回调
        var currentCallback = GLFW.glfwSetErrorCallback(originalErrorCallback);
        if (currentCallback) currentCallback.free();
    }
}

/**
 * 设置系统剪贴板内容
 * @param {string} text 要设置的文本内容
 */
function setClipboard(text) {
    let windowHandle = 0;
    // 转换为UTF-8字节数组
    var textBytes = text.getBytes(Charsets.UTF_8);
    var requiredCapacity = textBytes.length + 1;  // +1 for null terminator

    if (requiredCapacity <= clipboardScratchBuffer.capacity()) {
        // 使用预分配的缓冲区处理小文本
        clipboardScratchBuffer.clear();
        clipboardScratchBuffer.put(textBytes);
        clipboardScratchBuffer.put(0);  // Null终止符
        clipboardScratchBuffer.flip();
        GLFW.glfwSetClipboardString(windowHandle, clipboardScratchBuffer);
    } else {
        // 为大文本分配临时缓冲区
        var tempBuffer = MemoryUtil.memAlloc(requiredCapacity);
        try {
            tempBuffer.put(textBytes);
            tempBuffer.put(0);
            tempBuffer.flip();
            GLFW.glfwSetClipboardString(windowHandle, tempBuffer);
        } finally {
            MemoryUtil.memFree(tempBuffer);  // 确保释放内存
        }
    }
}
