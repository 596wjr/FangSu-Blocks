

function setPlatform(configBuilder, pos, state, block) {

    //MinecraftClient.displayMessage("[" + String(Timing.elapsed()) + "] " + "[loaded] " + block.getCustomConfig("platformState"), false);
    state.platformState = JSON.parse(block.getCustomConfig("platformState"));
    if (state.platformState === null || state.platformState === undefined) state.platformState = [];

    let defaultPlatformState = state.platformState

    state.platformState = [];

    let platform = configBuilder.getOrCreateCategory(ComponentUtil.literal("选择站台"));
    let entryBuilder = configBuilder.entryBuilder();
    let station = MinecraftClient.getStationAt(pos)
    //entryBuilder.startDropdownMenu()
    let platformInfoList = getPlatformInfo(station);
    platformInfoList.sort((a, b) => a.platformName.localeCompare(b.platformName));
    for (let i = 0; i < platformInfoList.length; i++) {
        let platformInfo = platformInfoList[i];

        let defaultFlag;
        if (defaultPlatformState === null || defaultPlatformState === undefined) {
            defaultFlag = false;
        } else {
            let foundFlag = defaultPlatformState.find(item => item.platformId === platformInfo.platformId);
            defaultFlag = foundFlag ? foundFlag.flag : false;
        }

        platform.addEntry(
            entryBuilder.startBooleanToggle(
                ComponentUtil.literal(platformInfo.platformName + " -> " + platformInfo.endpointStation), // 显示的文本
                defaultFlag // 初始状态
            ).setSaveConsumer((checked) => {
                //MinecraftClient.displayMessage("[" + String(Timing.elapsed()) + "] " + platformInfo.platformName + " -> " + platformInfo.endpointStation + "State update to: " + String(checked), false);

                state.platformState.push({ platformId: platformInfo.platformId, platformInfo, flag: checked });


            }).setDefaultValue(defaultFlag) // 默认值
                .build()
        );
    }


    configBuilder.setSavingRunnable(() => {
        //MinecraftClient.displayMessage("[" + String(Timing.elapsed()) + "] " + "[saved] : " + JSON.stringify(state.platformState), false);
        block.putCustomConfig("platformState", JSON.stringify(state.platformState));
        block.sendUpdateC2S();
    })
    MinecraftClient.displayMessage(JSON.stringify(state.platformState), false);
    return { builder: configBuilder, platformState: state.platformState };

}

function getPlatformInfo(station) {
    // 获取与车站关联的所有平台
    let platforms = Array.from(MTRClientData.DATA_CACHE.requestStationIdToPlatforms(station.id).values());

    // 用来存储平台信息的数组
    let platformInfos = platforms.map(platform => {


        // 站台编号
        let platformId = platform.id ? String(BigInt(platform.id)) : "?";
        let platformName = platform.name || "?";
        //print("[DEBUG] " + "pl" + "/" + platformId);

        let routeDetails;
        let lastRoute;
        let endpointStation;

        try {
            routeDetails = MTRClientData.DATA_CACHE.requestPlatformIdToRoutes(platform.id);
            lastRoute = routeDetails[routeDetails.length - 1];
            endpointStation = lastRoute.stationDetails[lastRoute.stationDetails.length - 1].stationName;
        } catch (e) {
            routeDetails = "?";
            lastRoute = "?";
            endpointStation = "?";
        }


        return {
            platformName: platformName,
            platformId: platformId,           // 站台编号
            platformIdStr: platform.id.toString(),
            endpointStation: endpointStation  // 终点站名称
        };
    });

    return platformInfos;
}