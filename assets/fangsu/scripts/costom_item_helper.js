function checkConfig(block, configName, defaultVal) {
    let custom = block.getCustomConfig(configName);
    if (!custom) {
        // print("[DEBUG] @ costom_item_helper.js : ", configName, " is not available as ", custom);
        block.putCustomConfig(configName, String(defaultVal));
        block.sendUpdateC2S();
        return defaultVal;
    }
    // print("[DEBUG] @ costom_item_helper.js : ", configName, " is available : ", custom);
    if (custom == "false") return false;
    if (custom == "0") return 0;
    return custom;
}

function checkAndCacheConfig(block, state, configName, defaultVal) {
    let custom = block.getCustomConfig(configName);
    let cackeKey = `cache${configName.charAt(0).toUpperCase() + configName.slice(1)}`;
    if (!custom) {
        // print("[DEBUG] @ costom_item_helper.js : ", configName, " is not available as ", custom);
        block.putCustomConfig(configName, String(defaultVal));
        block.sendUpdateC2S();
        state[cackeKey] = defaultVal;
        return defaultVal;
    }
    // print("[DEBUG] @ costom_item_helper.js : ", configName, " is available : ", custom);
    state[cackeKey] = custom;
    if (custom == "false") return false;
    if (custom == "0") return 0;
    return custom;
}

function checkCache(block, state, configName) {
    let custom = block.getCustomConfig(configName);
    if (custom == "false") custom = false;
    if (custom == "0") custom = 0;
    let cackeKey = `cache${configName.charAt(0).toUpperCase() + configName.slice(1)}`;
    let cache = state[cackeKey];
    let current = state[configName];
    let flag = false;
    if (cache != custom) {
        state[configName] = custom;
        state[cackeKey] = current;
        setDebugInfo(`the cache of ${configName} is ${current} which is different in custom ${custom}`);

        flag = true;
    }
    if (current != cache) {
        setDebugInfo(`the current of ${configName} is ${current} which is different in cache ${cache}`);
        flag = true;
    }
    if (flag) {
        block.putCustomConfig(configName, String(current));
        block.sendUpdateC2S();
        state[cackeKey] = current;
    }
    return flag;
}
