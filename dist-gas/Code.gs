/**
 * Google Apps Script Web App Controller for PDF PRO BY Oatdh
 * 100% Client-Side Pure Browser PDF Suite
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('PDF PRO BY Oatdh')
    .setFaviconUrl('https://cdn-icons-png.flaticon.com/512/337/337946.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
