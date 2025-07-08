function checkConfig(block, configName, defaultVal) {
    let custom = block.getCustomConfig(configName);
    if (!custom) {
        // print("[DEBUG] @ costom_item_helper.js : ", configName, " is not available as ", custom);
        block.putCustomConfig(configName, defaultVal);
        block.sendUpdateC2S();
        return defaultVal;
    }
    // print("[DEBUG] @ costom_item_helper.js : ", configName, " is available : ", custom);
    return custom;
}