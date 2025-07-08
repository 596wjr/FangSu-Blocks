function getScoreboard(id) {
    try {
        let player = MinecraftClient.getPlayer().entity;
        player.method_7327().method_1166("YanQing_596").get("mtr_balance").method_1124(10);
    } catch (e) {
        setWarnInfo(e); // 你的错误处理函数
    }
}
