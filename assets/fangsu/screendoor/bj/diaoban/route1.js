var cjkFont = font.deriveFont(height * 0.075);
var cjkFontBold = font.deriveFont(Font.BOLD, height * 0.75);
var nonCjkFont = font.deriveFont(Font.BOLD, height * 0.03);

var nextStationIndex = drawInfo.stationIndex;

var distances = width * 0.85 / (drawInfo.route.drawStations.length - 1);

var arrowLeft = loadRes(res, "img", "fangsu:sign/alb.png");
var arrowRight = loadRes(res, "img", "fangsu:sign/arb.png");

for (var i = 0; i < drawInfo.route.drawStations.length; i++) {
    var originalTransform = g.getTransform();
    var j;
    if (drawInfo.direction) j = drawInfo.route.drawStations.length - 1 - i;
    else j = i;

    var station = drawInfo.route.drawStations[j];
    var stationnameCjk = getMatching(station.stationName, true);
    var stationnameNonCjk = getMatching(station.stationName, false);

    var drawX = width * 0.075 + distances * i;
    var hasPassed = j < nextStationIndex + (drawInfo.direction ? 1 : 0);

    if (i < drawInfo.route.drawStations.length - 1) {
        g.setColor(hasPassed ? rgbToColor(63, 63, 63) : intToColor(drawInfo.route.routeColor));
        g.fillRect(drawX, height * 0.45, distances + 1, height * 0.1);
    }

    if (j < nextStationIndex) {
        var transform = AffineTransform.getRotateInstance(1.75 * Math.PI, drawX, height * 0.5);
        g.setTransform(transform);
        g.setFont(cjkFont);
        g.drawString(stationnameCjk, drawX + height * 0.1, height * 0.53 - g.getFontMetrics(nonCjkFont).getHeight() * 1.15);
        g.setFont(nonCjkFont);
        g.drawString(stationnameNonCjk, drawX + height * 0.1, height * 0.53);
        if (station.transInfo.length > 0) {
            g.setColor(rgbToColor(63, 63, 63));
            g.fillRect(drawX - height * 0.4, height * 0.53, height * 0.4, height * 0.03);
            g.setFont(font.deriveFont(height * 0.06));
            g.setColor(rgbToColor(63, 63, 63));
            g.drawString(getMatching(station.transInfo[0].routeName, true), drawX - height * 0.4, height * 0.51)
        }
        g.setTransform(originalTransform);

        if (station.transInfo) {
            g.setColor(rgbToColor(63, 63, 63));
            g.fillOval(drawX - height * 0.07, height * 0.43, height * 0.14, height * 0.14);
            g.setColor(rgbToColor(116, 116, 116));
            g.fillOval(drawX - height * 0.06, height * 0.44, height * 0.12, height * 0.12);
        } else {
            g.setColor(rgbToColor(116, 116, 116));
            g.fillOval(drawX - height * 0.03, height * 0.47, height * 0.06, height * 0.06);
        }
        g.setColor(rgbToColor(63, 63, 63));


    } else if (j > nextStationIndex) {
        var transform = AffineTransform.getRotateInstance(1.75 * Math.PI, drawX, height * 0.5);
        g.setTransform(transform);
        g.setColor(Color.BLACK);
        g.setFont(cjkFont);
        g.drawString(stationnameCjk, drawX + height * 0.1, height * 0.53 - g.getFontMetrics(nonCjkFont).getHeight() * 1.15);
        g.setFont(nonCjkFont);
        g.drawString(stationnameNonCjk, drawX + height * 0.1, height * 0.53);
        if (station.transInfo.length > 0) {
            g.setColor(station.transInfo[0].routeColor);
            g.fillRect(drawX - height * 0.4, height * 0.53, height * 0.4, height * 0.03);
            g.setFont(font.deriveFont(height * 0.06));
            g.setColor(Color.BLACK);
            g.drawString(getMatching(station.transInfo[0].routeName, true), drawX - height * 0.4, height * 0.51)
        }
        g.setTransform(originalTransform);

        if (station.transInfo.length > 0) {
            g.setColor(intToColor(drawInfo.route.routeColor));
            g.fillOval(drawX - height * 0.07, height * 0.43, height * 0.14, height * 0.14);
            g.setColor(rgbToColor(116, 116, 116));
            g.fillOval(drawX - height * 0.06, height * 0.44, height * 0.12, height * 0.12);
        } else {
            g.setColor(rgbToColor(116, 116, 116));
            g.fillOval(drawX - height * 0.03, height * 0.47, height * 0.06, height * 0.06);
        }
        g.setColor(rgbToColor(63, 63, 63));
    } else {
        var transform = AffineTransform.getRotateInstance(1.75 * Math.PI, drawX, height * 0.5);
        g.setTransform(transform);
        var finalWidth = Math.max(g.getFontMetrics(cjkFont).stringWidth(stationnameCjk), g.getFontMetrics(nonCjkFont).stringWidth(stationnameNonCjk));
        var finalHeight = g.getFontMetrics(nonCjkFont).getHeight() * 1.15 + g.getFontMetrics(cjkFont).getHeight() + height * 0.04;
        g.setColor(intToColor(drawInfo.route.routeColor));
        g.fillRoundRect(drawX + height * 0.09, height * 0.55 - finalHeight, finalWidth + height * 0.02, finalHeight, height * 0.03, height * 0.03);
        g.setColor(isLightColor(intToColor(drawInfo.route.routeColor)) ? Color.BLACK : Color.WHITE);
        g.setFont(cjkFont);
        g.drawString(stationnameCjk, drawX + height * 0.1, height * 0.53 - g.getFontMetrics(nonCjkFont).getHeight() * 1.15);
        g.setFont(nonCjkFont);
        g.drawString(stationnameNonCjk, drawX + height * 0.1, height * 0.53);
        if (station.transInfo.length > 0) {
            g.setColor(station.transInfo[0].routeColor);
            g.fillRect(drawX - height * 0.4, height * 0.53, height * 0.4, height * 0.03);
            g.setFont(font.deriveFont(height * 0.06));
            g.setColor(Color.BLACK);
            g.drawString(getMatching(station.transInfo[0].routeName, true), drawX - height * 0.4, height * 0.51)
        }
        g.setTransform(originalTransform);

        g.setColor(intToColor(drawInfo.route.routeColor));
        g.fillOval(drawX - height * 0.07, height * 0.43, height * 0.14, height * 0.14);
        g.setColor(rgbToColor(127, 0, 0));
        g.fillOval(drawX - height * 0.06, height * 0.44, height * 0.12, height * 0.12);

        // if (drawInfo.direction) {
        //     g.drawImage(arrowLeft, width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk) - height * 0.225, height * 0.25, height * 0.4, height * 0.4, null)
        //     g.setColor(Color.BLACK);
        //     g.setFont(cjkFont);
        //     g.drawString("列车行进方向", height * 0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk), height * 0.5);
        //     g.setFont(nonCjkFont);
        //     g.drawString("To " + terminalNameNonCjk, height * 0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk), height * 0.7);
        // }
        // else {
        //     g.drawImage(arrowRight, width * 0.5 + 0.5 * (terminalLengthCjk + toLengthCjk) - height * 0.225, height * 0.25, height * 0.4, height * 0.4, null)
        //     g.setColor(Color.BLACK);
        //     g.setFont(cjkFont);
        //     g.drawString("开往", height * -0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk), height * 0.5);
        //     g.setFont(cjkFontBold);
        //     g.drawString(terminalNameCjk, height * -0.225 + width * 0.5 - 0.5 * (terminalLengthCjk + toLengthCjk) + toLengthCjk, height * 0.5);
        //     g.setFont(nonCjkFont);
        //     g.drawString("To " + terminalNameNonCjk, height * -0.225 + width * 0.5 + 0.5 * (terminalLengthCjk + toLengthCjk) - terminalLengthNonCjk, height * 0.7);
        // }
    }

}