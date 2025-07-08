// line_util.js
// include("text_util.js");
include("color_util.js");
include("js_util.js");


function parseLineName(lineStr) {
    return getCJKLineName(getMatching(lineStr, true)) + "|" + getNonCJKLineName(getMatching(lineStr, false));
}

function getCJKLineName(lineStr) {
    let pattern = /^(\d+|[\u4e00-\u9fa5]+)线$/; // 正则表达式
    var match = lineStr.match(pattern); // 匹配字符串

    if (match && match[1]) {
        return match[1]; // 返回提取的部分
    } else {
        if (lineStr.endsWith("号线")) {
            let numberPart = lineStr.replace("号线", "");
            return parseInt(numberPart);
        } else {
            return null;
        }
    }
}

function getNonCJKLineName(lineStr) {
    let pattern = /^Line\s+(\d+|[A-Za-z]+)$/; // 正则表达式
    var match = lineStr.match(pattern); // 匹配字符串

    if (match && match[1]) {
        return match[1]; // 返回提取的部分
    } else {
        match = lineStr.match(/([A-Za-z\s]+)\sLine/);
        if (match && match[1]) {
            return match[1];
        } else {
            return lineStr;
        }
    }
}

function isNumLine(lineStr) {
    return String(getCJKLineName(TextUtil.getCjkParts(lineStr))) == String(getNonCJKLineName(TextUtil.getNonCjkParts(lineStr))) ? true : false;
}

function drawLineBadge(g, lineInfo, x, y) {
    let { name, color } = lineInfo;
    let parsedName = parseLineName(name);
    let isNumber = isNumLine(name);

    // 背景框参数
    let padding = 8;
    let cornerRadius = 6;

    // 文字样式
    let cjkSize = isNumber ? 32 : 24;
    let nonCjkSize = isNumber ? 24 : 18;

    // 计算尺寸
    let textInfo = formatBilingualText(name, cjkSize, nonCjkSize);
    let mainWidth = calculateTextDimensions(g, textInfo.cjk,
        SOURCE_HAN_SANS_CN_BOLD.deriveFont(cjkSize)).width;

    // 绘制背景
    g.setColor(color);
    g.fillRoundRect(
        x - mainWidth / 2 - padding,
        y - cjkSize - padding,
        mainWidth + padding * 2,
        cjkSize + nonCjkSize + padding * 2,
        cornerRadius,
        cornerRadius
    );

    // 绘制文字
    drawBilingualText(g, textInfo, x, y, 1);
}

function drawBilingualText(g, textInfo, x, y, alignment) {
    let { cjk, nonCjk, cjkSize, nonCjkSize } = textInfo;

    // 中文部分
    g.setFont(SOURCE_HAN_SANS_CN_BOLD.deriveFont(parseFloat(cjkSize)));
    let cjkWidth = g.getFontMetrics().stringWidth(cjk);
    g.drawString(cjk, x - cjkWidth / 2, y - nonCjkSize - 2);

    // 英文部分
    g.setFont(ROBOTO_BOLD.deriveFont(parseFloat(nonCjkSize)));
    let nonCjkWidth = g.getFontMetrics().stringWidth(nonCjk);
    g.drawString(nonCjk, x - nonCjkWidth / 2, y);
}

// train_util.js
let STATUS_MAP = {
    NO_ROUTE: "no_route",
    WAITING: "waiting_for_departure",
    DEPARTING: "leaving_depot",
    RUNNING: "on_route",
    ARRIVED: "arrived",
    CHANGING: "changing_route",
    RETURNING: "returning_to_depot"
};

function getTrainStatus(train) {
    if (train.getAllPlatforms().size() == 0) return STATUS_MAP.NO_ROUTE;
    if (!train.isOnRoute()) return STATUS_MAP.WAITING;
    if (train.getAllPlatformsNextIndex() === train.getAllPlatforms().size())
        return STATUS_MAP.RETURNING;
    if (onPlatformRail(train))
        return STATUS_MAP.ARRIVED;
    return STATUS_MAP.RUNNING;
}

function onPlatformRail(train) {
    let path1 = train.path().get(train.getRailIndex(train.getRailProgress(0), false)); // 车头所在轨道
    let path2 = train.path().get(train.getRailIndex(train.getRailProgress(train.trainCars() - 1), true)); // 车尾所在轨道
    let nextPlatformId = train.getAllPlatforms().get(train.getAllPlatformsNextIndex()).platform.id;
    return path1.dwellTime != 0 && path1.savedRailBaseId == nextPlatformId || path2.dwellTime != 0 && path2.savedRailBaseId == nextPlatformId;
}

/**
 * 获取列车当前路线信息。
 * 对于回库车，返回只有终点站和车厂名称的 stationDetails
 * @param {Train} train 要获取路线信息的列车。
 * @param {PlatformInfo} platformInfo 本线路某一站台，用于获取路线信息。
 */
function getRouteInfo(train, trainStatus, platformInfo) {
    if (platformInfo == null) {
        return null;
    }

    let routeName = platformInfo.route.name;
    let routeColor = new Color(platformInfo.route.color);
    let destination = platformInfo.destinationStation == null ? UNKNOWN_STATION : platformInfo.destinationStation.name;
    let lastRouteDestination = getLastRoute(train, trainStatus) == null ? null : train.getAllPlatforms().get(train.getAllPlatforms().indexOf(train.getThisRoutePlatforms().get(0)) - 1).station;
    let circularState = platformInfo.route.circularState.toString();
    let depotName = getDepot(train).name;

    let routeInfo = {
        routeName: routeName,
        routeColor: routeColor,
        destination: destination,
        lastRouteDestination: lastRouteDestination == null ? null : { stationName: lastRouteDestination.name, interchangeInfo: getAllInterchangeRoutes(lastRouteDestination, getLastRoute(train, trainStatus), platformInfo.route) },
        nextRouteInfo: null,
        circularState: circularState,
        depotName: depotName,
        stationDetails: []
    };

    let nextRoutePlatformInfo = getNextRoute(train, trainStatus) == null ? null : train.getAllPlatforms().get(train.getAllPlatforms().indexOf(train.getThisRoutePlatforms().get(train.getThisRoutePlatforms().size() - 1)) + 1);
    if (nextRoutePlatformInfo != null) {
        routeInfo.nextRouteInfo = {};
        routeInfo.nextRouteInfo.routeName = nextRoutePlatformInfo.route.name;
        routeInfo.nextRouteInfo.routeColor = new Color(nextRoutePlatformInfo.route.color);
        routeInfo.nextRouteInfo.destination = nextRoutePlatformInfo.destinationStation == null ? UNKNOWN_STATION : nextRoutePlatformInfo.destinationStation.name;
        routeInfo.nextRouteInfo.circularState = nextRoutePlatformInfo.route.circularState.toString();
        routeInfo.nextRouteInfo.firstStation = { stationName: nextRoutePlatformInfo.station.name, interchangeInfo: getAllInterchangeRoutes(nextRoutePlatformInfo.station, getNextRoute(train, trainStatus), null) }; // TODO 获取下一个路线的下一个路线
    }

    if (trainStatus == STATUS_MAP.RETURNING) { // 对于回库车，train.getThisRoutePlatforms() 为空，故设置只有终点站和车厂名称的 stationDetails
        routeInfo.stationDetails.push({ stationName: platformInfo.station.name, interchangeInfo: getAllInterchangeRoutes(platformInfo.station, platformInfo.route, null) });
        routeInfo.stationDetails.push({ stationName: depotName });
    } else {
        for (let platformInfoo of train.getThisRoutePlatforms()) {
            if (platformInfoo.station == null) {
                routeInfo.stationDetails.push({
                    platformName: platformInfoo.platform.name,
                    platformDwellTime: 0,
                    stationName: "?",
                    interchangeInfo: []
                });
            } else {
                routeInfo.stationDetails.push({
                    platformName: platformInfoo.platform.name,
                    platformDwellTime: platformInfoo.platform.dwellTime,
                    reverseAtPlatform: platformInfoo.reverseAtPlatform,
                    stationName: platformInfoo.station.name,
                    interchangeInfo: getAllInterchangeRoutes(platformInfoo.station, platformInfoo.route, getNextRoute(train)),
                    distance: platformInfoo.distance
                });
            }
        }
    }

    return routeInfo;
}

/**
 * 获取列车是否位于站台轨道上，且该站台轨道是列车下一个停靠的站台。
 * @param {Train} train 要获取的列车。
 * @return {Boolean} 
 */
function onPlatformRail(train) {
    let path1 = train.path().get(train.getRailIndex(train.getRailProgress(0), false)); // 车头所在轨道
    let path2 = train.path().get(train.getRailIndex(train.getRailProgress(train.trainCars() - 1), true)); // 车尾所在轨道
    let nextPlatformId = train.getAllPlatforms().get(train.getAllPlatformsNextIndex()).platform.id;
    return path1.dwellTime != 0 && path1.savedRailBaseId == nextPlatformId || path2.dwellTime != 0 && path2.savedRailBaseId == nextPlatformId;
}

/**
 * 获取列车的上一个路线。
 * @param {Train} train 要获取上一个路线的列车。
 * @return {Route} 上一个路线。如果不存在或下一个路线为隐藏路线，返回 null。
 */
function getLastRoute(train, trainStatus) {
    if (trainStatus != STATUS_MAP.RETURNING) {
        let thisRouteFirstStation = train.getThisRoutePlatforms().get(0);
        if (train.getAllPlatforms().get(0) != thisRouteFirstStation) { // 列车路径的起点不为本线路起点
            let lastRoute = train.getAllPlatforms().get(train.getAllPlatforms().indexOf(thisRouteFirstStation) - 1).route; // 返回本线路第一个车站的上一个车站所属的路线
            return lastRoute.isHidden ? null : lastRoute;
        }
    }
    return null;
}

/**
 * 获取列车的下一个路线。
 * @param {Train} train 要获取下一个路线的列车。
 * @return {Route} 下一个路线。如果不存在或下一个路线为隐藏路线，返回 null。
 */
function getNextRoute(train, trainStatus) {
    if (trainStatus != STATUS_MAP.RETURNING) {
        let thisRouteDestination = train.getThisRoutePlatforms().get(train.getThisRoutePlatforms().size() - 1);
        if (train.getAllPlatforms().get(train.getAllPlatforms().size() - 1) != thisRouteDestination) { // 列车路径的终点不为本线路终点
            let nextRoute = train.getAllPlatforms().get(train.getAllPlatforms().indexOf(thisRouteDestination) + 1).route; // 返回本线路最后一个车站的下一个车站所属的路线
            return nextRoute.isHidden ? null : nextRoute;
        }
    }
    return null;
}

/**
 * 获取列车侧线所在的车厂。
 * @param {Train} train 要获取车厂的列车。
 * @return {Depot} 列车侧线所在的车厂。
 */
function getDepot(train) {
    return getMapValueByKey(MTRClientData.DATA_CACHE.sidingIdToDepot, train.siding().id);
}

/**
 * 获取某车站的所有换乘信息（包括连接车站）。
 * @param {Station} station 要获取换乘信息的车站。
 * @param {Route} thisRoute 本路线。
 * @param {Route} nextRoute 下一个路线。可以为 null。
 * @return {Array} 换乘信息数组。
 */
function getAllInterchangeRoutes(station, thisRoute, nextRoute) {
    let interchangeRoutes = [];
    getInterchangeRoutes(station, thisRoute, nextRoute, false, interchangeRoutes); // 获取本站的换乘信息
    getMapValueByKey(MTRClientData.DATA_CACHE.stationIdToConnectingStations, station).forEach(connectingStation => { // 获取连接车站的换乘信息
        getInterchangeRoutes(connectingStation, thisRoute, nextRoute, true, interchangeRoutes);
    });
    return interchangeRoutes;
}

/**
 * 获取某车站（不含连接车站）的换乘信息。
 * @param {Station} station 要获取换乘信息的车站。
 * @param {Route} thisRoute 本路线。
 * @param {Route} nextRoute 下一个路线。可以为 null。
 * @param {Boolean} isConnectingStation 在获取连接车站的换乘信息时，此参数应传入 true，否则为 false。
 * @param {Array} interchangeRoutes 换乘信息数组，获取到的换乘信息会追加到该数组末尾。
 */
function getInterchangeRoutes(station, thisRoute, nextRoute, isConnectingStation, interchangeRoutes) {
    let thisRouteNameSplit = thisRoute.name;
    let nextRouteNameSplit = nextRoute == null ? null : nextRoute.name;

    let routesInStation = getMapValueByKey(MTRClientData.DATA_CACHE.stationIdToRoutes, station.id);

    if (routesInStation != null) {
        for (let interchangeRoute of routesInStation.values()) {
            if (interchangeRoute.name != thisRouteNameSplit && interchangeRoute.name != nextRouteNameSplit) {
                interchangeRoutes.push({ name: interchangeRoute.name, color: new Color(interchangeRoute.color), isConnectingStation: isConnectingStation });
            }
        }
    }
}

