var cjkFont = font.deriveFont(height * 0.25);
var cjkFontBold = font.deriveFont(Font.BOLD, height * 0.25);
var nonCjkFont = font.deriveFont(Font.BOLD, height * 0.1);
var terminalNameCjk = getMatching(drawInfo.route.drawStations[drawInfo.stationIndex].stationName, true);
var terminalNameNonCjk = getMatching(drawInfo.route.drawStations[drawInfo.stationIndex].stationName, false);

var terminalLengthCjk = g.getFontMetrics(cjkFontBold).stringWidth(terminalNameCjk);
var terminalLengthNonCjk = g.getFontMetrics(nonCjkFont).stringWidth(terminalNameNonCjk);
g.setColor(Color.BLACK);
g.setFont(cjkFontBold);
g.drawString(terminalNameCjk, height * 0.225 + width * 0.5 - 0.5 * (terminalLengthCjk), height * 0.5);
g.setFont(nonCjkFont);
g.drawString(terminalNameNonCjk, height * 0.225 + width * 0.5 - 0.5 * (terminalLengthNonCjk), height * 0.7);