importPackage(java.awt);
importPackage(java.awt.font);
importPackage(java.text);
// color_util.js
function rgbToColor(r, g, b) {
    return new java.awt.Color(r / 255, g / 255, b / 255);
} function rgbaToColor(r, g, b, a) {
    return new java.awt.Color(r / 255, g / 255, b / 255, a > 1 ? a / 100 : a);
}

function intToColor(num) {
    // 确保取低24位，并转换为十六进制字符串
    //var hex = (num & 0xFFFFFF).toString(16).toUpperCase();
    // 补零至6位长度并添加#前缀
    return new java.awt.Color(num);
}

function isLightColor(color) {
    if (color === undefined) return true;
    const luminance = 0.299 * color.getRed() +
        0.587 * color.getGreen() +
        0.114 * color.getBlue();
    return luminance > 128;
}

function getContrastColor(baseColor) {
    return isLightColor(baseColor) ? Color.BLACK : Color.WHITE;
}

function adjustColorBrightness(color, factor) {
    return new Color(
        Math.min(255, Math.max(0, color.getRed() * factor)),
        Math.min(255, Math.max(0, color.getGreen() * factor)),
        Math.min(255, Math.max(0, color.getBlue() * factor))
    );
}