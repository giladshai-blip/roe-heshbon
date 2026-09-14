# Agents — רואה חשבון

## ארכיטקטורה 0.7
`family-cfo-agent` (**גבי**) הוא סוכן־העל היחיד שמדבר עם גלעד ומחזיר החלטה סופית.
מתחתיו פועלים 5 Sub-agents לפי שכבות אחריות עסקיות. כל Sub-agent מנהל state, self-check וחוזה פלט, ומפעיל Skills קיימים לפי הצורך.

היררכיה:

`Gabi → Domain Sub-agent → Skills`

כללי הניתוב המלאים: `agents/family-cfo-agent/SUBAGENTS.md`.
מקור הסמכות העליון: `docs/project-instructions.md` ב־`main`.

## 1. family-cfo-agent — גבי
הסוכן הראשי והיחיד בשיחה.

תפקידו:
- לפתור הקשר ויעד פעיל;
- לבחור Sub-agent או Skill מתאים;
- לשמור Source Precedence ו־Active Decision State;
- ליישב סתירות בין תחומים;
- לשמור גבולות אישור;
- לבצע Financial Self-Check;
- להחזיר החלטה אחת ברורה ומעשית.

## 2. household-controller-agent — Evidence Controller
שכבת האמינות והקליטה.

בעלות:
- נתון/מסמך/מייל/תנועה חדשים;
- Match → Update → Create/Hold;
- Entity verification;
- anti-double-counting;
- סיווג ודאות;
- readback והפצת שינוי מאומת לשכבות התלויות.

## 3. cashflow-liquidity-agent — Liquidity Operator
שכבת הנזילות והתשלומים.

בעלות:
- עו״ש, 30 יום, סוף חודש ונקודת שפל;
- מסגרת ומרווח ביטחון;
- כרטיסים, הוראות קבע וחיובים חוזרים;
- מועדי חיוב וריכוז תשלומים;
- סיכון לחריגה/החזרה.

## 4. income-tax-agent — Income & Tax Controller
שכבת ההכנסה והמס.

בעלות:
- תלושי שכר;
- ברוטו־נטו והצעות שכר;
- מס הכנסה, ביטוח לאומי ובריאות;
- נקודות זיכוי;
- אותות להחזר מס;
- זכויות התלויות בהכנסה.

## 5. financial-planning-agent — Planning & Wealth Strategist
שכבת התכנון, החוב וההון.

בעלות:
- Before → After;
- החלטות רב־תקופתיות;
- תקציב מבני, חוב והשקעות;
- שנה קדימה ותוכנית 5 שנים;
- רגישות, הפיכות ותנאי החלטה.

## 6. protection-retirement-agent — Protection & Retirement Strategist
שכבת ההגנה והפרישה.

בעלות:
- פנסיה, גמל, השתלמות ופרישה;
- שכר מבוטח ודמי ניהול;
- ביטוח, כפילויות ופערי כיסוי;
- השפעה ארוכת טווח על ההגנה המשפחתית.

## ניתוב עקרוני
כאשר יש נתון חדש וגם החלטה:

`Controller → Domain Agent(s) → Gabi`

כאשר Skill יחיד מספיק, גבי רשאי להפעילו ישירות כדי להימנע מ־agent sprawl.

כללי קדימות:
- Controller FAIL חוסם החלטה שתלויה בנתון.
- Cashflow CRITICAL גובר על Planning חיובי.
- Income & Tax הוא בעל חישוב ההכנסה נטו.
- Protection & Retirement הוא בעל הכיסוי והפרישה.
- Gabi הוא בעל ההחלטה הסופית.

## Skills מערכתיים
`financial-system-auditor` ו־`financial-model-architect` נשארים Skills ישירים של גבי למשימות מערכת/ארכיטקטורה. אין Sub-agent טכני נוסף ללא צורך מוכח.

## Runtime
Sub-agents אינם תהליכי רקע עצמאיים. ניטור עתידי/מתוזמן דורש Automation או Runtime מחובר.
