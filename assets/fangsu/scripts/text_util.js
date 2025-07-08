function hasCjkPart(str) {
    return TextUtil.getCjkParts(str).length > 0;
}

function hasNonCjkPart(str) {
    return TextUtil.getNonCjkParts(str).length > 0;
}


/**
 * 绘制双语言混合字符串（支持中日韩字符与拉丁字符混合排版）
 * 
 * @param {java.awt.Graphics2D} g - Java AWT绘图上下文对象
 * @param {java.awt.Font} cjkFont - **中日韩文字体基础对象**
 * @param {java.awt.Font} nonCjkFont - **非中日韩文字体基础对象**
 * @param {string} str - 要绘制的原始字符串（自动分离中日韩部分与非中日韩部分）
 * @param {number} x - 基准点X坐标（根据对齐方式计算实际绘制起点）
 * @param {number} y - 基准点Y坐标（字符串底部基线位置）
 * @param {number} h - 总绘制高度（自动计算中日韩与非中日韩字体大小）
 * @param {0|1|2} bd - 基准点水平对齐方式：
 *                     - 0: 左对齐（基准点为左侧）
 *                     - 1: 居中对齐（基准点为水平中心）
 *                     - 2: 右对齐（基准点为右侧）
 * @param {0|1|2} d - 子内容对齐方式：
 *                    - 0: 左对齐（中日韩与非中日韩部分左侧对齐）
 *                    - 1: 居中对齐（各部分在总宽度内居中）
 *                    - 2: 右对齐（各部分在总宽度内右侧对齐）
 * @returns {number} 实际绘制的总宽度（像素）
 * 
 * @example
 * // 在(100,200)位置居中绘制高度30的双语文字
 * const width = drawStrDL(g, "路线 Line 1", 100, 200, 30, 1, 1);
 * 
 * @remarks
 * - 中日韩部分使用65%的高度，非中日韩部分使用30%的高度
 * - 垂直布局固定：中日韩在上方，非中日韩在下方
 * 
 * @throws 当传入无效的bd/d参数时，控制台输出错误信息并返回0
 */
function drawStrDL(g, cjkFont, nonCjkFont, str, x, y, h, bd, d) {
    let drawCjkPart = getMatching(str, true);
    let drawNonCjkPart = getMatching(str, false);
    let cjkSize = drawNonCjkPart == "" ? h * 0.9 : drawCjkPart == "" ? 0 : h * 0.65;
    let nonCjkSize = drawCjkPart == "" ? h * 0.85 : drawNonCjkPart == "" ? 0 : h * 0.3;
    let drawCjkFont = cjkFont.deriveFont(cjkSize);
    let drawNonCjkFont = nonCjkFont.deriveFont(nonCjkSize);
    let drawCjkWidth = g.getFontMetrics(drawCjkFont).stringWidth(drawCjkPart);
    let drawNonCjkWidth = g.getFontMetrics(drawNonCjkFont).stringWidth(drawNonCjkPart);
    let drawStrWidth = Math.max(drawCjkWidth, drawNonCjkWidth);
    let bx;
    switch (bd) {
        case 0:
            bx = x;
            break
        case 1:
            bx = x - 0.5 * drawStrWidth;
            break;
        case 2:
            bx = x - drawStrWidth;
            break;
        default:
            bx = x;
    }
    switch (d) {
        case 0:
            g.setFont(drawCjkFont);
            g.drawString(drawCjkPart, bx, y + cjkSize);
            g.setFont(drawNonCjkFont);
            g.drawString(drawNonCjkPart, bx, y + h - (drawCjkPart == "" ? h * 0.1 : 0));
            return drawStrWidth;
        case 1:
            g.setFont(drawCjkFont);
            g.drawString(drawCjkPart, bx + 0.5 * drawStrWidth - 0.5 * drawCjkWidth, y + cjkSize);
            g.setFont(drawNonCjkFont);
            g.drawString(drawNonCjkPart, bx + 0.5 * drawStrWidth - 0.5 * drawNonCjkWidth, y + h - (drawCjkPart == "" ? h * 0.1 : 0));
            return drawStrWidth;
        case 2:
            g.setFont(drawCjkFont);
            g.drawString(drawCjkPart, bx + drawStrWidth - drawCjkWidth, y + cjkSize);
            g.setFont(drawNonCjkFont);
            g.drawString(drawNonCjkPart, bx + drawStrWidth - drawNonCjkWidth, y + h - (drawCjkPart == "" ? h * 0.1 : 0));
            return drawStrWidth;
        default:
            print("[ERROR] 参数错误 bd=", bd, "d=", d);
            return 0;
    }
}

/**
 * 绘制单行文字（统一字体，不分语言）
 * 
 * @param {java.awt.Graphics2D} g - Java AWT绘图上下文对象
 * @param {java.awt.Font} font - 统一使用的字体对象
 * @param {string} str - 要绘制的原始字符串
 * @param {number} x - 基准点X坐标（根据对齐方式计算实际绘制起点）
 * @param {number} y - 基准点Y坐标（字符串底部基线位置）
 * @param {number} h - 字体高度（直接作为字体大小）
 * @param {0|1|2} align - 水平对齐方式：
 *                     - 0: 左对齐（基准点为左侧）
 *                     - 1: 居中对齐（基准点为水平中心）
 *                     - 2: 右对齐（基准点为右侧）
 * @returns {number} 实际绘制的总宽度（像素）
 */
function drawStrUnified(g, font, str, x, y, h, align) {
    let drawFont = font.deriveFont(h);
    g.setFont(drawFont);
    
    let metrics = g.getFontMetrics();
    let strWidth = metrics.stringWidth(str);
    
    let drawX = x;
    switch (align) {
        case 0: // 左对齐
            break;
        case 1: // 居中对齐
            drawX = x - strWidth / 2;
            break;
        case 2: // 右对齐
            drawX = x - strWidth;
            break;
        default:
            print("[ERROR] 无效的对齐参数 align=", align);
            return 0;
    }
    
    // 绘制文字
    g.drawString(str, drawX, y);
    
    return strWidth;
}


function getLineWrap(g, str, font, fontSize, w) {
    return TextUtil.isCjk(str) ?
        getCjkLineWrap(g, String(str), font, fontSize, w) :
        getNoncjkLineWrap(g, String(str), font, fontSize, w)
}

function getCjkLineWrap(g, str, font, fontSize, w) {
    let finalFont = font.deriveFont(fontSize);
    let currentLine = "";
    let lines = [];
    for (let char of str) {
        if (char == '\n') {
            lines.push(currentLine);
            currentLine = "";
        }
        let testLine = currentLine + char;
        let testWidth = g.getFontMetrics(finalFont).stringWidth(testLine);
        if (testWidth <= w) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = char;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function getNoncjkLineWrap(g, str, font, fontSize, w) {
    let finalFont = font.deriveFont(fontSize);
    let words = str.split(" ");
    let currentLine = "";
    let lines = [];
    for (let char of words) {
        if (char == '\n') {
            lines.push(currentLine);
            currentLine = "";
        }
        let testLine = currentLine + char + " ";
        let testWidth = g.getFontMetrics(finalFont).stringWidth(testLine);
        if (testWidth <= w) {
            currentLine = testLine;
        } else {
            if (g.getFontMetrics(finalFont).stringWidth(char) <= w) {
                lines.push(currentLine);
                currentLine = char + " ";
                continue;
            }
            currentLine = "";
            for (let letter of char) {
                let localTestLine = currentLine + letter + " ";
                if (g.getFontMetrics(finalFont).stringWidth(localTestLine) >= w) {
                    lines.push(currentLine + "-");
                    currentLine = letter;
                }
                else {
                    currentLine = currentLine + letter;
                }
            }
            currentLine = currentLine + " ";

        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function insertString(originalStr, insertStr, position) {
    return originalStr.slice(0, position) + insertStr + originalStr.slice(position);
}
function removeChar(str, index) {
    return str.slice(0, index) + str.slice(index + 1);
}