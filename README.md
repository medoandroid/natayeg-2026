<!-- DevMeDoAnDrOiD -->
# 🎓 منظومة نتائج الثانوية العامة 2026 - Ultra Performance Search Engine

<p align="center">
  <img src="https://img.shields.io/badge/Developer-DevMeDoAnDrOiD-0284c7?style=for-the-badge&logo=github" alt="DevMeDoAnDrOiD">
  <img src="https://img.shields.io/badge/Speed-%3C%202ms-10b981?style=for-the-badge" alt="Speed">
  <img src="https://img.shields.io/badge/Records-919%2C396-a855f7?style=for-the-badge" alt="Records">
  <img src="https://img.shields.io/badge/Database-SQLite%20FTS5-f59e0b?style=for-the-badge" alt="SQLite FTS5">
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python" alt="Python">
</p>

نظام استعلام وبحث فائق السرعة والأداء مخصص لنتائج الثانوية العامة، يقوم بتحويل ملف Excel ضخم ينطوي على أكثر من **919,396 صفاً** إلى قاعدة بيانات ذكية مُمَثَّلة بحجم **101 ميجابايت** فقط، مع محرك بحث **FTS5** يوفر سرعة استجابة فائقة تصل إلى **أقل من 2 ملي ثانية**.

---

## 🌟 الميزات الرئيسية (Key Features)

- ⚡ **سرعة استجابة فائقة (< 2ms)**: استعلام لحظي مباشر أثناء الكتابة بدون إعادة تحميل الصفحة.
- 🎯 **دعم البحث المتعدد**: البحث برقم الجلوس أو اسم الطالب (بحث جزئي أو كامل) مع محرك مطابقة الكلمات بالبادئات.
- 📊 **حساب النسب المئوية الكلية**: إظهار النسبة المئوية الدقيقة لكل طالب تلقائياً بناءً على الدرجة العظمى.
- 📜 **شهادة وثيقة رسمية موثقة (Certificate Modal)**: استعراض شهادة تفاعلية فاخرة لكل طالب مع خيار الطباعة المباشرة ونسخ البيانات.
- 💎 **تصميم عصري متجاوب (Silicon Valley Premium UI)**:
  - دعم الوضعين المظلم والمضيء (Dark & Light Modes).
  - التبديل السلس بين عرض الجدول وعرض كروت البطاقات الذكية.
  - لوحة تحليلات وإحصائيات تفاعلية (KPI Analytics Dashboard).
  - ميزة التصفح اللانهائي والتحميل الكسول (Infinite Scroll & Lazy Loading).
  - ذاكرة مؤقتة فائقة السرعة (Micro-Caching) تتيح استرجاع الاستعلامات السابقة في **0.1ms**.
- 📥 **تصدير البيانات إلى CSV**: إمكانية تنزيل نتائج البحث والنسب المئوية بضغطة زر واحدة بترميز UTF-8 الداعم للغة العربية.

---

## 📁 هيكلية المشروع (Project Structure)

```text
ntega/
├── index.html              # واجهة المستخدم الرئيسية (RTL & SEO Supported)
├── style.css               # نظام التنسيقات العصرية (Glassmorphism & Variables)
├── app.js                  # المنطق البرمجي للواجهة (Debouncing, Fetch, Caching, Modals)
├── server.py               # خادم Python متعدد الخيوط والـ API
├── prepare_database.py     # كود تحويل ملف Excel إلى قاعدة بيانات SQLite FTS5
├── run.bat                 # تشغيل سريع بنقرة واحدة لأنظمة Windows
├── requirements.txt        # المكتبات المطلوبة (pandas, openpyxl)
├── .gitignore              # ملف استبعاد الملفات الزائدة لـ Git
└── README.md               # التوثيق الرسمي للمشروع
```

---

## 🚀 طريقة التشغيل (Quick Start)

### 1. تثبيت المتطلبات (Requirements)
قم بتثبيت المكتبات المطلوبة عبر الأمر التالي:
```bash
pip install -r requirements.txt
```

### 2. تجهيز قاعدة البيانات (Database Preparation)
إذا كان ملف Excel موجوداً باسم `نتيجة ثانوية عامة نظام حديث.xlsx` في المجلد، قم بتشغيل كود التحضير:
```bash
python prepare_database.py
```
*سيتم إنشاء ملف قاعدة البيانات `ntega.db` والفهارس المحسنة تلقائياً.*

### 3. تشغيل الخادم (Run Server)
قم بتشغيل خادم الويب:
```bash
python server.py
```
أو عبر التشغيل السريع في Windows بالضغط المزدوج على ملف `run.bat`.

افتح المتصفح على الرابط:
👉 **`http://localhost:8000`**

---

## 🔒 الأمان والجودة البرمجية

- الاعتماد الكامل على المكتبات القياسية لخادم Python لضمان أقصى درجات الأداء والاستقرار.
- حماية المدخلات والتشفير القياسي للأحرف UTF-8 لمنع مشاكل الترميز باللغة العربية.
- وسم مائي توثيقي مدمج باسم **DevMeDoAnDrOiD**.

---

<p align="center">
  <b>Developed with ❤️ by DevMeDoAnDrOiD</b><br>
  Copyright &copy; 2026 MeDoAnDrOiD. All Rights Reserved.
</p>
<!-- Copyright (c) 2026 MeDoAnDrOiD. All Rights Reserved. -->
