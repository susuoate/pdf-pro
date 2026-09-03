/**
 * PDF Pro - Google Apps Script Web App Entrypoint
 * 
 * Instructions:
 * 1. Open Google Apps Script: https://script.google.com/
 * 2. Create a new project.
 * 3. Paste this code into "Code.gs".
 * 4. Create an HTML file named "index" and paste the content from "dist-gas/index.html".
 * 5. Click "Deploy" > "New deployment" > Select type "Web app".
 * 6. Set "Execute as": "Me", "Who has access": "Anyone" (or organization).
 * 7. Click "Deploy" and open your web app URL!
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('PDF PRO BY Oatdh — ระบบจัดการไฟล์ PDF ครบวงจร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}
