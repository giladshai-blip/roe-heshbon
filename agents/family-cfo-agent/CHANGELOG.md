# גבי — היסטוריית גרסאות

קובץ זה הוא יומן הגרסאות הקנוני של הסוכן **גבי** בפרויקט `רואה חשבון`.

## כללי גרסאות
- **Agent Version** מתאר את גרסת ההתנהגות, ההנחיות, היכולות והאורקסטרציה של גבי בריפו.
- **Runtime Model** מתאר את מודל ChatGPT שמריץ את הסוכן בזמן השיחה ואינו מחליף את מספר גרסת הסוכן.
- שינוי התנהגות/יכולת של גבי מחייב עדכון גרסה ותיעוד כאן.
- שינוי בפיתוח מתחיל ב־`dev` או בענף פיתוח ייעודי מבוסס `main`; `main` נשאר קו יציב.
- אין לשמור כאן סודות, tokens, סיסמאות או נתונים פיננסיים אישיים רגישים.

---

## 0.6.0 — Personal Learning Layer

**תאריך קידום:** 2026-09-14  
**סטטוס:** Stable / `main`  
**Branch מקור:** `dev-gabi-0.6-learning`  
**Base:** `0.5.0`  
**Runtime Model בעת הקידום:** `GPT-5.6 Sol`

### מה השתנה
- גבי הפך לסוכן אישי לומד שמסתגל באופן מתמשך ומבוקר לגלעד.
- נוסף מנגנון `Observe → Candidate → Evidence → Confidence → Apply → Validate → Promote`.
- נוסף Context First לפני שאלת הבהרה.
- נוסף Intent Compression לפקודות קצרות כגון `תזרים`, `מה חדש`, `תבדוק`, `תתקן`, `מאושר`.
- נוספה התאמת תשובה לברירת מחדל קצרה, ישירה ומעשית.
- נוסף Friction Learning לזיהוי תיקונים חוזרים והפיכתם לשיפור מערכת קבוע.
- נוסף `LEARNED-PATTERNS.md` כרישום דפוסים מאומתים.
- נוסף `DECISION-MEMORY.md` ללמידת אופן קבלת החלטות בלי לעקוף מקור אמת.
- נשמר Memory Boundary: זיכרון והעדפות אינם מחליפים נתון פיננסי מאומת.
- נשמר Level 2 Action Bias רק לפעולות בטוחות, הפיכות ומותרות.
- נוספו KPI למדידת חיכוך, תיקונים, צעדים לתוצאה, רעש ושימור דפוסים.

### בדיקות
- 12/12 תרחישי Learning Regression עברו ברמת המפרט.
- פקודת `מה חדש` נבדקה בשימוש אמיתי ועבדה לפי המשמעות החדשה.
- Context First / `תבדוק` נבדקו בשימוש אמיתי.
- לא נוספה הרשאה לפעולה בלתי הפיכה.
- מקור אמת מאומת ממשיך לגבור על Memory/Preference/Decision Pattern.
- גלעד אישר מפורשות את קידום הגרסה ל־`main`.

### קבצים קנוניים
- `agents/family-cfo-agent/AGENT.md`
- `agents/family-cfo-agent/versions/0.6.0.md`
- `agents/family-cfo-agent/LEARNED-PATTERNS.md`
- `agents/family-cfo-agent/DECISION-MEMORY.md`
- `agents/family-cfo-agent/tests/0.6-learning-regression.md`
- `agents/family-cfo-agent/tests/0.6-regression-results.md`

### מגבלות ידועות
- אין תהליך רקע רציף של למידה ללא Runtime/Automation מתאים.
- KPI הלמידה אינם נמדדים אוטומטית בכל מצב.
- פעולות פיננסיות בלתי הפיכות ושינויי קוד אפליקטיביים ממשיכים לדרוש אישור לפי ההנחיה המרכזית.

### שינוי בהנחיה המרכזית
לא נדרש שינוי נוסף ב־`docs/project-instructions.md`: ההנחיה כבר מגדירה את `family-cfo-agent` כסוכן הראשי ואת גבולות מקור האמת, האוטונומיה והאימות. 0.6.0 מרחיבה את התנהגות הסוכן בתוך גבולות אלה.

---

## 0.6.0-dev — Personal Learning Layer

**תאריך התחלה:** 2026-09-14  
**סטטוס:** Completed / promoted to 0.6.0  
**Branch:** `dev-gabi-0.6-learning`  
**Base:** `0.5.0` מ־`main`

### תכולת הפיתוח
- Adaptive Learning Spec.
- Learned Patterns Registry.
- Decision Memory.
- 12 תרחישי Regression ותוצאות בדיקה.
- Overlay פיתוח שאוחד לבסוף לתוך `AGENT.md` הקנוני.

---

## 0.5.0 — Baseline

**תאריך בסיס:** 2026-09-14  
**סטטוס:** Previous Stable  
**שם הסוכן בשיחה:** גבי  
**Agent ID:** `family-cfo-agent`  
**Runtime Model בעת קביעת הבסיס:** `GPT-5.6 Sol`

### תפקיד
גבי הוא הסוכן הפיננסי הראשי של פרויקט `רואה חשבון` ומשמש שכבת אורקסטרציה לניהול התמונה הפיננסית המשפחתית, ניתוח, תחזיות, אימות מסמכים, סיכונים, המלצות ותפעול מערכת פיננסית בהתאם ל־`docs/project-instructions.md`.

### יכולות בסיס
- Always-On Conversation Mode.
- תמונת מצב פיננסית.
- מקור אמת מרכזי.
- Match → Update → Create ומניעת ספירה כפולה.
- Proactive Mode.
- Level 2 Operational Autonomy.
- Full Skill Autonomy.

---

## מדיניות התפתחות מכאן
כל שדרוג עתידי יתחיל בענף פיתוח מתאים, יתועד וייבדק לפני קידום ל־`main`.
בכל שדרוג יתועדו: למה שודרג, מה השתנה, אילו קבצים הושפעו, איך נבדק, מה עדיין חסר והאם נדרש שינוי ב־`docs/project-instructions.md`.
