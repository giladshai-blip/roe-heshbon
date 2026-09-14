# גבי — היסטוריית גרסאות

קובץ זה הוא יומן הגרסאות הקנוני של הסוכן **גבי** בפרויקט `רואה חשבון`.

## כללי גרסאות
- **Agent Version** מתאר את גרסת ההתנהגות, ההנחיות, היכולות והאורקסטרציה של גבי בריפו.
- **Runtime Model** מתאר את מודל ChatGPT שמריץ את הסוכן בזמן השיחה ואינו מחליף את מספר גרסת הסוכן.
- שינוי התנהגות/יכולת של גבי מחייב עדכון גרסה ותיעוד כאן.
- שינוי בפיתוח מתחיל ב־`dev` או בענף פיתוח ייעודי מבוסס `main`; `main` נשאר קו יציב.
- אין לשמור כאן סודות, tokens, סיסמאות או נתונים פיננסיים אישיים רגישים.

---

## 0.7.0 — Verified Adaptive Agent

**תאריך קידום:** 2026-09-14  
**סטטוס:** Stable / `main`  
**Runtime Model בעת הקידום:** `GPT-5.6 Sol`

### מה השתנה בגבי
- נוסף Context Resolver מלא לפני שאלת הבהרה.
- נוספה Entity Mapping Layer לישויות פיננסיות מאומתות.
- נוסף Active Decision State כך ש־`מאושר` חל רק על הפעולה הפעילה והמוגדרת ביותר.
- נוסף Financial Self-Check: `Freshness → Source → Conflict → Duplicate Risk → Forecast Impact → Confidence`.
- נוסף Correction Learning Loop עם Root Cause ובעלות על תיקון.
- נוסף Decision Engine 0.7 להכרעה אחת ברורה לאחר שקלול תזרים, סיכון, עלות, גמישות, מאמץ, אופק, אי־ודאות והפיכות.
- נשמר Level 2 Operational Autonomy עם Action Contract ו־readback.
- 16/16 תרחישי Runtime Regression עברו לפני קידום.

### Skill Pack תומך
- Skill Pack V1.6 הוסיף Event Ingestion, Recurring Payments, Payslip Audit, Inbox Intake ו־Decision Impact Simulation.
- Router עודכן ל־`intent + active_goal + new_evidence + required_action`.

### Sub-Agent Architecture 0.7
שכבת הסוכנים שמתחת לגבי נבנתה מחדש כבעלי אחריות עסקיים עם state, self-check וחוזה פלט:
1. `household-controller-agent` — Evidence Controller.
2. `cashflow-liquidity-agent` — Liquidity Operator.
3. `income-tax-agent` — Income & Tax Controller.
4. `financial-planning-agent` — Planning & Wealth Strategist.
5. `protection-retirement-agent` — Protection & Retirement Strategist.

כללי הארכיטקטורה:
- רק גבי מחזיר החלטה סופית לגלעד.
- נתון חדש עובר Controller לפני צריכה בשכבות אחרות.
- Cashflow `CRITICAL` גובר על Planning חיובי עד לפתרון סיכון נזילות.
- Income & Tax הוא בעל חישוב ההכנסה נטו.
- Protection & Retirement הוא בעל הכיסוי והפרישה.
- Skills מערכתיים/ארכיטקטוניים יכולים להישאר ישירות תחת גבי כדי למנוע agent sprawl.

### בדיקות Sub-agents
- 20/20 תרחישי Architecture Regression עברו ברמת specification/readback.
- נבדקו: מקור אמת, כפילויות, סתירת זהות, גבולות אישור, תחזית מול מאומת, תרחיש שאינו נכתב כאירוע, החזר מס ללא הבטחת יתר, הגנת ביטוח, קדימות נזילות ובעלות על החלטה סופית.

### שינוי בהנחיה המרכזית
לא נדרש שינוי ב־`docs/project-instructions.md`: ההנחיה כבר קובעת שגבי הוא שכבת השיחה והאורקסטרציה היחידה, שמקור האמת הוא הקובץ הפיננסי, וש־Skills/Sub-agents הם רכיבים פנימיים. השינוי מממש את המבנה בתוך הגבולות הקיימים.

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
