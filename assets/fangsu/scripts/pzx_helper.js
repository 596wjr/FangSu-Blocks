// 碰撞箱数组转字符串
function collisionBoxArrToStr(collisionArray) {
    let finalShape = "";
    if (typeof (collisionArray[0]) == Number) {
        for (let i = 0; i < 6; i++) {

            finalShape += (rs[i]).toFixed(2);

            if (i != 5) finalShape += ",";
        }
    } else
        for (let rs of collisionArray) {
            if (finalShape != "") finalShape += "/"
            for (let i = 0; i < 6; i++) {

                finalShape += (rs[i]).toFixed(2);

                if (i != 5) finalShape += ",";
            }
        }
    return finalShape;
}

/**
 * 偏移碰撞箱
 * @param {number[]|number[][]} collisionBoxes - 碰撞箱数据，支持两种格式：
 *     1. 单个碰撞箱 [x1,y1,z1,x2,y2,z2]
 *     2. 碰撞箱数组 [[x1,y1,z1,x2,y2,z2], ...]
 * @param {string} axis - 偏移轴 ('x'/'y'/'z')
 * @param {number} offset - 偏移长度（单位：米）
 * @returns {number[][]} 偏移后的碰撞箱数组（始终返回数组形式）
 */
function offsetCollisionBoxes(collisionBoxes, axis, offset) {
    // 统一转换为数组形式处理
    let isSingleBox = !Array.isArray(collisionBoxes[0]);
    let boxes = isSingleBox ? [collisionBoxes] : collisionBoxes;

    // 确定轴索引 (x:0, y:1, z:2)
    var axisMap = { x: 0, y: 1, z: 2 };
    var axisIndex = axisMap[axis.toLowerCase()];
    if (axisIndex === undefined) {
        throw new Error("Invalid axis: " + axis + ". Must be 'x', 'y' or 'z'");
    }
    // 对每个碰撞箱进行偏移
    var result = [];
    for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        // 使用slice(0)复制原数组
        var newBox = box.slice(0);

        // 对轴的两个端点都进行偏移
        newBox[axisIndex] += offset;      // 第一个点 (x1/y1/z1)
        newBox[axisIndex + 3] += offset;  // 第二个点 (x2/y2/z2)

        result.push(newBox);
    }
    return result;
}

/**
 * 合并碰撞箱
 * @param {number[]|number[][]} boxes1 - 第一个碰撞箱数据
 * @param {number[]|number[][]} boxes2 - 第二个碰撞箱数据
 * @returns {number[][]} 合并后的碰撞箱数组
 */
function mergeCollisionBoxes(boxes1, boxes2) {
    // 统一转换为二维数组形式
    var normalizedBoxes1 = normalizeBoxes(boxes1);
    var normalizedBoxes2 = normalizeBoxes(boxes2);

    // 合并两个数组
    var merged = [];
    for (var i = 0; i < normalizedBoxes1.length; i++) {
        merged.push(normalizedBoxes1[i].slice(0));
    }
    for (var j = 0; j < normalizedBoxes2.length; j++) {
        merged.push(normalizedBoxes2[j].slice(0));
    }

    return merged;
}
/**
 * 标准化碰撞箱输入（统一转为二维数组）
 * @private
 */
function normalizeBoxes(boxes) {
    if (boxes.length === 0) return [];

    // 检查是否是单个碰撞箱（非嵌套数组）
    if (typeof boxes[0] === 'number') {
        return [boxes.slice(0)]; // 转为二维数组
    }

    // 已经是二维数组的情况
    var result = [];
    for (var i = 0; i < boxes.length; i++) {
        result.push(boxes[i].slice(0));
    }
    return result;
}

// 碰撞箱字符串转数组
function collisionBoxStrToArr(collisionString) {
    if (!collisionString) return [];
    return collisionString.split('/').map(function (part) {
        return part.split(',').map(Number);
    });
}




// 旋转中心常量定义
var ROTATION_CENTER = [0.5, 0, 0.5];

/**
 * 主处理函数：带中心点修正的碰撞箱旋转
 * @param {number[]} collisionBox - 原始碰撞箱 [x1,y1,z1,x2,y2,z2]
 * @param {number} rX - X轴旋转弧度
 * @param {number} rY - Y轴旋转弧度
 * @param {number} rZ - Z轴旋转弧度
 * @returns {number[][]} 旋转后的碰撞箱列表
 */
function rotateCollisionBox(collisionBox, rX, rY, rZ, tX, tY, tZ) {
    [tX, tZ] = [-1 * tZ, tX]
    var [x1, y1, z1, x2, y2, z2] = collisionBox;
    if (rX == 0 && rY == 0 && rZ == 0) return [[x1 + tX, y1 + tY, z1 + tZ, x2 + tX, y2 + tY, z2 + tZ]];
    var step = 0.1;

    var result = [];
    if (rX != 0 && rY == 0 && rZ == 0) {
        var subBoxes = getSubBoxesWithSkip(collisionBox, 0);
        // MinecraftClient.displayMessage("SubBoxes: " + String(subBoxes), false);

        // 处理每个子碰撞箱
        for (var subBox of subBoxes) {
            var rotated = subBox;

            rotated = rotateX(rotated, rX);
            var finBox = boxCenterToMainBoxWithSkip(rotated, collisionBox, 0);
            result.push([finBox[0] + tX, finBox[1] + tY, finBox[2] + tZ, finBox[3] + tX, finBox[4] + tY, finBox[5] + tZ]);
        }
    } else if (rX == 0 && rY != 0 && rZ == 0) {
        var subBoxes = getSubBoxesWithSkip(collisionBox, 1);
        // MinecraftClient.displayMessage("SubBoxes: " + String(subBoxes), false);

        // 处理每个子碰撞箱
        for (var subBox of subBoxes) {
            var rotated = subBox;

            rotated = rotateY(rotated, rY);
            var finBox = boxCenterToMainBoxWithSkip(rotated, collisionBox, 1);
            result.push([finBox[0] + tX, finBox[1] + tY, finBox[2] + tZ, finBox[3] + tX, finBox[4] + tY, finBox[5] + tZ]);
        }
    } else if (rX == 0 && rY == 0 && rZ != 0) {
        var subBoxes = getSubBoxesWithSkip(collisionBox, 3);
        // MinecraftClient.displayMessage("SubBoxes: " + String(subBoxes), false);

        // 处理每个子碰撞箱
        for (var subBox of subBoxes) {
            var rotated = subBox;

            rotated = rotateZ(rotated, rZ);
            var finBox = boxCenterToMainBoxWithSkip(rotated, collisionBox, 2);
            result.push([finBox[0] + tX, finBox[1] + tY, finBox[2] + tZ, finBox[3] + tX, finBox[4] + tY, finBox[5] + tZ]);
        }
    }
    else {
        // 沿选定轴细分原始碰撞箱
        var subBoxes = getSubBoxes(collisionBox);
        // MinecraftClient.displayMessage("SubBoxes: " + String(subBoxes), false);

        // 处理每个子碰撞箱
        for (var subBox of subBoxes) {
            var rotated = subBox;

            rotated = rotateX(rotated, rX); rotated = rotateY(rotated, rY); rotated = rotateZ(rotated, rZ);
            var finBox = boxCenterToMainBox(rotated)
            result.push([finBox[0] + tX, finBox[1] + tY, finBox[2] + tZ, finBox[3] + tX, finBox[4] + tY, finBox[5] + tZ]);
        }
    }

    return result;
}

// 辅助函数模块
// ===============================================

function getSubBoxes(mainBox) {
    var [x1, y1, z1, x2, y2, z2] = mainBox;
    var step = 5;
    var subBox = [];
    for (let x = x1; x < x2; x += step) {
        for (let y = y1; y < y2; y += step) {
            for (let z = z1; z < z2; z += step) {
                subBox.push([x + step * 0.5, y + step * 0.5, z + step * 0.5]);
                // MinecraftClient.displayMessage("subBox: " + String([x + step * 0.5, y + step * 0.5, z + step * 0.5]), false);
            }
        }
    }
    return subBox;
}

function boxCenterToMainBox(subBox) {
    var [x, y, z] = subBox;
    return [x - 3, y - 3, z - 3, x + 3, y + 3, z + 3];
}

function getSubBoxesWithSkip(mainBox, skipAxis) {
    var [x1, y1, z1, x2, y2, z2] = mainBox;
    var step = 1.5;
    var subBox = [];
    if (skipAxis == 0) {
        for (let y = y1; y < y2; y += step) {
            for (let z = z1; z < z2; z += step) {
                subBox.push([(x1 + x2) * 0.5, y + step * 0.5, z + step * 0.5]);
            }
        }
    } else if (skipAxis == 1) {
        for (let x = x1; x < x2; x += step) {

            for (let z = z1; z < z2; z += step) {
                subBox.push([x + step * 0.5, (y1 + y2) * 0.5, z + step * 0.5]);
            }
        }

    } else if (skipAxis == 2) {
        for (let x = x1; x < x2; x += step) {
            for (let y = y1; y < y2; y += step) {

                subBox.push([x + step * 0.5, y + step * 0.5, (z1 + z2) * 0.5]);

            }
        }
    } else
        for (let x = x1; x < x2; x += step) {
            for (let y = y1; y < y2; y += step) {
                for (let z = z1; z < z2; z += step) {
                    subBox.push([x + step * 0.5, y + step * 0.5, z + step * 0.5]);
                }
            }
        }
    return subBox;
}

function boxCenterToMainBoxWithSkip(subBox, oringinal, skipAxis) {
    var [x, y, z] = subBox;
    if (skipAxis == 0) {
        return [oringinal[0], y - 1, z - 1, oringinal[3], y + 1, z + 1];
    } if (skipAxis == 1) {
        return [x - 1, oringinal[1], z - 1, x + 1, oringinal[4], z + 1];
    } if (skipAxis == 2) {
        return [x - 1, y - 1, oringinal[2], x + 1, y + 1, oringinal[5]];
    }
    return [x - 1, y - 1, z - 1, x + 1, y + 1, z + 1];
}

// 单轴旋转函数
// ===============================================

function rotateX(vertex, angle) {
    if (angle == 0) return vertex;
    angle *= -1;
    var x = vertex[0] - 8;
    var y = vertex[1];
    var z = vertex[2] - 8;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    return [
        x + 8,
        y * cos - z * sin,
        y * sin + z * cos + 8
    ];
}

function rotateY(vertex, angle) {
    if (angle == 0) return vertex;
    var x = vertex[0] - 8;
    var y = vertex[1];
    var z = vertex[2] - 8;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    return [
        x * cos + z * sin + 8,
        y,
        -x * sin + z * cos + 8
    ];
}

function rotateZ(vertex, angle) {
    if (angle == 0) return vertex;
    angle *= -1;
    var x = vertex[0] - 8;
    var y = vertex[1];
    var z = vertex[2] - 8;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    return [
        x * cos - y * sin + 8,
        x * sin + y * cos,
        z + 8
    ];
}