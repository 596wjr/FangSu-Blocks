/**
 *
 * @param {String} type
 * @param {*} data
 */
function routeObj(type, data) {
    this.route = {};
    this._load(type, data);
}

routeObj.prototype._load = function (type, data) {
    if (type == "routePlatform") this.route = routeToObj(data);
    if (type == "route" || type == "mtrRoute") this.route = mtrRouteToObj(data);
    if (type == "rmg") this.route = parseRmgRoute(data);
};

function routeToObj(route) {
    let drawStations = [];
    if (route.stationDetails == null) drawStations = [];
    else
        for (let station of route.stationDetails) {
            let transInfo = [];
            if (station) {
                if (station.interchangeInfo) {
                    for (interchange of station.interchangeInfo) {
                        if (interchange.isConnectingStation) continue;
                        if (TextUtil.getNonExtraParts(interchange.name) == TextUtil.getNonExtraParts(route.routeName)) continue;
                        transInfo.push({ routeName: interchange.name, routeColor: interchange.color });
                    }
                    drawStations.push({ stationName: station.stationName, transInfo: transInfo });
                } else if (station.interchangeRoutes) {
                    let interchangeNames = [];
                    for (interchange of station.interchangeRoutes) {
                        // if (interchange.isConnectingStation) continue;
                        if (getNonExtraParts(interchange.name) == getNonExtraParts(route.routeName)) {
                            setDebugInfo(`${getNonExtraParts(interchange.name)}  ${getNonExtraParts(route.routeName)}`);
                            continue;
                        }
                        if (interchangeNames.includes(interchange.name)) continue;
                        transInfo.push({ routeName: interchange.name, routeColor: intToColor(interchange.color) });
                        interchangeNames.push(interchange.name);
                    }
                    drawStations.push({ stationName: station.stationName, transInfo: transInfo });
                } else drawStations.push({ stationName: station.stationName, transInfo: [] });
            } else drawStations.push({ stationName: "未命名|Undefinded", transInfo: [] });
        }
    return {
        routeName: route.routeName,
        routeColor: intToColor(route.routeColor),
        destination: route.destination,
        circularState: route.circularState,
        depotName: route.depotName,
        stationDetails: route.stationDetails,
        drawStations
    };
}

function getRoutePlatform(route) {
    // let stationDetails = [];
    let platformIds = Array.from(route.platformIds);
    let platformNames = [];
    for (let p of route.platformIds.toArray()) {
        let stn = getStationByPlatform(getPlatformById(String(new java.lang.Long(p.platformId))));
        if (stn) platformNames.push(stn.name);
        else platformNames.push("未命名|Undefinded");
    }
    // setDebugInfo(`getting platnames: ${platformNames}`);
    let firstPlat = new java.lang.Long(platformIds[0].platformId);
    let routeList = getRouteByPlatId(firstPlat);

    let findRoute = {};

    // setDebugInfo(`finding route ${route.name}`);
    for (let r of routeList) {
        let objRoute = routeToObj(r);
        // setDebugInfo(`checking route ${objRoute.routeName}`);
        if (String(getNonExtraParts(String(objRoute.routeName))) != String(getNonExtraParts(String(route.name)))) {
            // setDebugInfo(`incorrect routename: ${String(getNonExtraParts(String(objRoute.routeName)))} != ${String(getNonExtraParts(String(r.name)))}`);
            continue;
        }
        for (let plat of objRoute.drawStations) {
            let haveSame = false;
            for (let p of platformNames) {
                if (p != plat.stationName) {
                    continue;
                }
                haveSame = true;
                break;
            }
            // setDebugInfo(`not able to find stn ${plat.stationName} !`);
            if (!haveSame) break;
        }
        findRoute = objRoute;
    }
    // setDebugInfo(`obj route found ${JSON.stringify(findRoute)}`);
    return findRoute;
}

function parseRmgRoute(rmgData) {
    // print(rmgData);
    let data = JSON.parse(String(rmgData));

    let stn_list = data.stn_list;
    let drawStations = [];
    // print(JSON.stringify(data));

    let nextStn = stn_list.linestart.children[0];

    while (nextStn) {
        let stn = stn_list[nextStn];
        let stationName = `${stn.localisedName.zh}|${stn.localisedName.en}`;
        let transInfo = [];
        if (stn.transfer.groups[0].lines) {
            for (let g of stn.transfer.groups) {
                for (let route of g.lines) {
                    transInfo.push({
                        routeName: `${route.name[0]}|${route.name[1]}`,
                        routeColor: hexToAwtColor(route.theme[2])
                    });
                }
            }
        }
        drawStations.push({ stationName, transInfo });
        nextStn = stn.children[0];
    }

    return {
        routeName: `${data.line_name[0]}|${data.line_name[1]}`,
        routeColor: parseInt(data.theme[2].substring(1), 16),
        destination: "1",
        circularState: "NONE",
        depotName: "",
        stationDetails: [],
        drawStations
    };
}

function getRouteById(id) {
    for (let route of MTRClientData.ROUTES) {
        if (String(new java.lang.Long(route.id)) === String(new java.lang.Long(id))) {
            return route;
        }
    }
    return null;
}

function getRouteByPlatId(platId) {
    return MTRClientData.DATA_CACHE.requestPlatformIdToRoutes(new java.lang.Long(platId));
}

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
