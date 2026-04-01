# 🚗 מצלמת הדרך - Travel Recorder

מערכת מצלמת דרך חכמה עם בינה מלאכותית, אחסון ענן וממשק בעברית.

![GitHub](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ תכונות עיקריות

### 🎥 הקלטה
- הקלטת וידאו באיכות HD (עד 1080p)
- מצלמה קדמית ואחורית
- הקלטה מחזורית אוטומטית
- שמירת GPS ומהירות על כל הקלטה

### 🧠 בינה מלאכותית (ADAS)
- זיהוי אובייקטים בזמן אמת (TensorFlow.js)
- זיהוי רכבים, הולכי רגל, אופנועים
- התראות התנגשות
- זיהוי מרחק ומהירות יחסית

### ☁️ ענן
- אחסון מקומי (IndexedDB)
- סנכרון אוטומטי לענן (Supabase)
- דלי ייעודי לכל משתמש
- גיבוי אוטומטי של הקלטות חירום

### 🔐 אבטחה
- הרשמה והתחברות עם אימייל
- כניסה כאורח (אנונימית)
- איפוס סיסמה
- מצב חשאי (Stealth mode)

### 📱 ממשק
- תמיכה מלאה בעברית (RTL)
- ממשק מותאם למובייל
- ניהול הקלטות
- סטטיסטיקות נסיעה
- ייצוא לבית משפט

## 🚀 התקנה והרצה

```bash
# התקנת תלויות
npm install

# הרצה בסביבת פיתוח
npm run dev

# בנייה לייצור
npm run build
```

## ⚙️ הגדרות סביבה

צור קובץ `.env` עם המשתנים הבאים:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
```

## 🛠️ טכנולוגיות

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **TensorFlow.js** - AI Object Detection
- **Supabase** - Backend & Storage
- **i18next** - Internationalization

## 📁 מבנה הפרויקט

```
src/
├── components/     # קומפוננטות React
├── hooks/         # Custom Hooks
├── i18n/          # קבצי תרגום
├── lib/           # תצורות (Supabase, etc.)
├── services/      # שירותים חיצוניים
├── types/         # TypeScript types
└── App.tsx        # קומפוננטה ראשית
```

## 🔧 תכונות מתוכננות

- [ ] מצלמת PiP (תמונה בתוך תמונה)
- [ ] זיהוי תמרורים
- [ ] יומן נסיעות מלא
- [ ] דחיסת וידאו לפני העלאה
- [ ] התראות תיקולים
- [ ] תמיכה ב-WebRTC לשידור חי

## 📄 רישיון

MIT

---

פותח עם ❤️ על ידי jelyashar-web
