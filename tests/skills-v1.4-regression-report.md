# דוח Regression — Skills V1.4

תאריך: 2026-09-13
Branch מקור בדיקה: `dev`
סטטוס: בדיקת לוגיקה לפני קידום סלקטיבי ל־`main`.

## מטרת הסבב
לבדוק שני פערי יכולת אמיתיים שנמצאו לאחר מיפוי מול Skills‑IL: התאמת תנועות בנק/כרטיס בפועל מול התכנון, וביקורת כיסויים/כפל ביטוחי. במקביל נבדקה חפיפה מול חבילת Skills הקיימת כדי להימנע מ־Skill sprawl.

## מיפוי חפיפה
- תקציב → כבר מכוסה על ידי `budget-planner` + `cashflow-guardian`: אין Skill חדש.
- פנסיה/חיסכון → כבר מכוסה על ידי `retirement-pension-advisor` + `wealth-investment-planner`: אין Skill חדש.
- שכר/מס → כבר מכוסה על ידי `income-tax-scenario-planner`: אין Skill חדש.
- עמלות/כרטיסים/חובות → מכוסה על ידי `credit-card-optimizer`, `credit-profile-optimizer`, `debt-loan-strategist`: אין Skill עמלות נוסף.
- זכויות/החזרי מס/ביטוח לאומי → מכוסה ברמת Router על ידי `benefits-rights-finder`: אין Skill חדש בשלב זה.
- תנועות בנק/כרטיס → פער אמיתי: נוסף `bank-transaction-reconciler`.
- כפל/חוסר ביטוחי → פער אמיתי: נוסף `insurance-coverage-auditor`.

## תרחישי bank-transaction-reconciler
- B01 CSV בנק עם חיוב שתוכנן מראש → Match → Update, לא Create כפול: PASS.
- B02 חיוב כרטיס מופיע בעו״ש כאשר העסקאות כבר נרשמו → מסומן סליקה/תזרים ולא הוצאה חדשה: PASS.
- B03 זיכוי מספק → לא מסווג אוטומטית כהכנסה שוטפת; ניסיון התאמה לעסקה מקורית: PASS.
- B04 העברה בין חשבונות משפחתיים → אינה הכנסה/הוצאה כלכלית: PASS.
- B05 שתי התאמות אפשריות לאותה תנועה → `WARN`/`דורש אימות`, ללא ניחוש: PASS.
- B06 אין Connector חי → ה־Skill אינו טוען לסנכרון בנקאי חי: PASS.

## תרחישי insurance-coverage-auditor
- INS01 שני ביטוחי בריאות עם פרטים חלקיים → `כפל אפשרי`, לא המלצת ביטול: PASS.
- INS02 חפיפה בין כיסוי פנסיוני לפרטי → שילוב `retirement-pension-advisor` והפרדה בין חיסכון לביטוח: PASS.
- INS03 ביטוח שנראה מיותר אך חסרים תנאי אכשרה/קבלה מחדש → `WARN`, אין ביטול: PASS.
- INS04 חיוב ביטוחי בפועל ללא פוליסה → העלות מאומתת אך הכיסוי עצמו אינו נחשב מאומת: PASS.
- INS05 חוסר כיסוי מול יעד/התחייבות מאומתים → ניתן לסמן חוסר; ללא יעד מאומת אין המצאת סכום: PASS.

## בדיקות Router ורוחב
- מסמך/צילום חדש עדיין עובר קודם דרך `financial-document-verifier`: PASS.
- פיד תנועות בנק/כרטיס מנותב ל־`bank-transaction-reconciler`: PASS.
- כפל/חוסר ביטוחי מנותב ל־`insurance-coverage-auditor`: PASS.
- anti-double-counting נשמר בין התאמת תנועות לתזרים/תקציב: PASS.
- אין שמירת סיסמאות, 2FA, PAT, tokens או סודות: PASS.
- אין טענה לחיבור בנקאי חי ללא Connector/Runtime פעיל: PASS.
- שני ה־Skills מחזירים חוזה `PASS/WARN/FAIL` עקבי: PASS.

## תוצאה
- בסיס V1.3: **31/31 PASS ברמת לוגיקה**.
- תרחישים חדשים V1.4: **11/11 PASS**.
- בדיקות Router ורוחב: **7/7 PASS**.
- סה״כ: **49/49 PASS ברמת לוגיקת ההנחיות**.

## מגבלות
הבדיקות הן בדיקות חוזה ולוגיקה של קובצי Skill/Router. אין כאן בדיקת Runtime חיה של בנקאות פתוחה, scraper, אתר חברת אשראי, הר הביטוח או Google Sheets. `bank-transaction-reconciler` הוא שכבת קליטה והתאמה, לא Connector בנקאי בפני עצמו.

## מסקנה
שני ה־Skills משלימים פערים אמיתיים ואינם משכפלים יכולת קיימת. לאחר קריאה חוזרת ניתן לקדם סלקטיבית ל־`main` את שני קובצי ה־Skill, ה־Router, `skills/README.md` ודוח זה בלבד.