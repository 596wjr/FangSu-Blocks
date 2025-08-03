var Color, Font, FontRenderContext, TextLayout;
try {
    // GraalJS 方式
    Color = Java.type("java.awt.Color");
    Font = Java.type("java.awt.Font");
    FontRenderContext = Java.type("java.awt.font.FontRenderContext");
    TextLayout = Java.type("java.text.TextLayout");
} catch (e) {
    // Rhino 方式
    importPackage(java.awt);
    importPackage(java.awt.font);
    importPackage(java.text);
    Color = java.awt.Color;
    Font = java.awt.Font;
    FontRenderContext = java.awt.font.FontRenderContext;
    TextLayout = java.text.TextLayout;
}
// color_util.js
function rgbToColor(r, g, b) {
    if (isGraalJS()) return new Color(r, g, b);
    else return new Color(r / 255, g / 255, b / 255);
}
function rgbaToColor(r, g, b, a) {
    if (isGraalJS()) return new Color(r, g, b, a > 1 ? a / 100 : a);
    else return new Color(r / 255, g / 255, b / 255, a > 1 ? (a > 100 ? a / 255 : a / 100) : a);
}

function intToColor(num) {
    // 确保取低24位，并转换为十六进制字符串
    // var hex = (num & 0xffffff).toString(16).toUpperCase();
    // 补零至6位长度并添加#前缀

    var rgb = num & 0xffffff;

    // 提取RGB分量
    var r = (rgb >> 16) & 0xff;
    var g = (rgb >> 8) & 0xff;
    var b = rgb & 0xff;

    // return new Color(num);
    return rgbToColor(r, g, b);
}

function isLightColor(color) {
    if (color === undefined) return true;
    const luminance = 0.299 * color.getRed() + 0.587 * color.getGreen() + 0.114 * color.getBlue();
    return luminance > 128;
}

function getContrastColor(baseColor) {
    return isLightColor(baseColor) ? Color.BLACK : Color.WHITE;
}

function adjustColorBrightness(color, factor) {
    return new Color(Math.min(255, Math.max(0, color.getRed() * factor)), Math.min(255, Math.max(0, color.getGreen() * factor)), Math.min(255, Math.max(0, color.getBlue() * factor)));
}
function hexToAwtColor(hexColor) {
    var hex = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
    var r,
        g,
        b,
        a = 255;

    if (hex.length === 3) {
        // 处理缩写形式如 "#abc"
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length === 6) {
        // 标准6位十六进制
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
        // 带alpha通道的8位十六进制
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16);
    } else {
        throw new Error("Invalid hex color format");
    }

    return new java.awt.Color(r, g, b, a);
}
