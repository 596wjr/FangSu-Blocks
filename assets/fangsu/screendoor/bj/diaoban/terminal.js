var cjkFont = font.deriveFont(height * 0.25);
var cjkFontBold = font.deriveFont(Font.BOLD, height * 0.25);
var nonCjkFont = font.deriveFont(Font.BOLD, height * 0.1);
var terminalNameCjk = getMatching(drawInfo.route.drawStations[drawInfo.route.drawStations.length - 1].stationName, true);
var terminalNameNonCjk = getMatching(drawInfo.route.drawStations[drawInfo.route.drawStations.length - 1].stationName, false);

var arrowLeft = loadRes(res, "img", "fangsu:sign/alb.png");
var arrowRight = loadRes(res, "img", "fangsu:sign/arb.png");

if (drawInfo.stationIndex == drawInfo.route.drawStations.length - 1) {
    g.setColor(Color.BLACK);
    g.setFont(cjkFontBold);
    g.drawString("终点站", height * 0.225 + width * 0.5 - 0.5 * (g.getFontMetrics(cjkFontBold).stringWidth("终点站")), height * 0.5);
    g.setFont(nonCjkFont);
    g.drawString("Terminal Station", height * 0.225 + width * 0.5 - 0.5 * (g.getFontMetrics(nonCjkFont).stringWidth("Terminal Station")), height * 0.7);
}
else {
    var terminalLengthCjk = g.getFontMetrics(cjkFontBold).stringWidth(terminalNameCjk);
    var terminalLengthNonCjk = g.getFontMetrics(nonCjkFont).stringWidth(terminalNameNonCjk);
    var toLengthCjk = g.getFontMetrics(cjkFont).stringWidth("开往 ");
    if (drawInfo.direction) {
        g.drawImage(arrowLeft, width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk) - height * 0.225, height * 0.25, height * 0.4, height * 0.4, null)
        g.setColor(Color.BLACK);
        g.setFont(cjkFont);
        g.drawString("开往", height * 0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk), height * 0.5);
        g.setFont(cjkFontBold);
        g.drawString(terminalNameCjk, height * 0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk) + toLengthCjk, height * 0.5);
        g.setFont(nonCjkFont);
        g.drawString("To " + terminalNameNonCjk, height * 0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk), height * 0.7);
    }
    else {
        g.drawImage(arrowRight, width * 0.5 + 0.5 * (terminalLengthCjk + toLengthCjk) - height * 0.225, height * 0.25, height * 0.4, height * 0.4, null)
        g.setColor(Color.BLACK);
        g.setFont(cjkFont);
        g.drawString("开往", height * -0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk), height * 0.5);
        g.setFont(cjkFontBold);
        g.drawString(terminalNameCjk, height * -0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk) + toLengthCjk, height * 0.5);
        g.setFont(nonCjkFont);
        g.drawString("To " + terminalNameNonCjk, height * -0.225 + width * 0.5 + 0.5 * (terminalLengthCjk + toLengthCjk) - terminalLengthNonCjk, height * 0.7);
    }
}