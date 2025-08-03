function draw(g, state, drawInfo) {
    var x = drawInfo.texArea[0];
    var y = drawInfo.texArea[1];
    var w = drawInfo.texArea[2] - drawInfo.texArea[0];
    var h = drawInfo.texArea[3] - drawInfo.texArea[1];
    g.setColor(Color.WHITE);
    g.fillRect(x, y, w, h);
}
