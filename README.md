# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets + Google Apps Script + RiseUp API.

## גרסה נוכחית
V5.2

## קבצים
- `src/Code.gs` — הקוד המלא הנוכחי להדבקה ב-Google Apps Script.
- `versions/riseup-sync-v5.2.gs` — עותק גרסה היסטורי של V5.2.

## עקרונות
- קוד מלא בכל גרסה, לא patch.
- סנכרון RiseUp עם upsert ומניעת כפילויות.
- יתרת עו״ש מחושבת מעוגן מאומת + תנועות checkingAccount חדשות.
- Health Check, יומן סנכרון, סריקת אימות, טריגר שעתי.
- דשבורד RTL בעברית עם 4 שעוני Gauge.

## אבטחה
אין לשמור PAT או סודות בקוד או ב-GitHub. את `RISEUP_PAT` יש לשמור ב-Script Properties בלבד.
