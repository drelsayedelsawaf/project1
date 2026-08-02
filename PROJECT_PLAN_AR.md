<div dir="rtl">

# خطة مشروع توقع مقاومة الإنسولين

## الهدف

بناء مشروع ويب متكامل لتشغيل نموذج:

`models/research_grade_type2_logistic_regression_model.pkl`

المشروع يحافظ على السياق الحالي:

- واجهة بحثية محلية اختيارية باستخدام Gradio داخل `UI.ipynb`.
- واجهة إنتاج باستخدام Next.js داخل `frontend/`.
- Backend باستخدام FastAPI داخل `backend/main.py`.
- نشر المشروع على Vercel من GitHub كمشروع واحد.

## الهيكل الحالي

- `backend/main.py`: تطبيق FastAPI الأساسي، ويحمل النموذج ويرجع التوقع من `/api/predict`.
- `api/index.py`: نقطة دخول Vercel القياسية التي تستورد تطبيق FastAPI من `backend.main`.
- `frontend/`: تطبيق Next.js الذي يرسل الطلبات إلى `/api/predict`.
- `models/`: يحتوي ملف النموذج المدرب.
- `requirements.txt`: مكتبات Python المطلوبة للـ Backend.
- `vercel.json`: يربط مسارات `/api/*` بالـ FastAPI وباقي المسارات بتطبيق Next.js.
- `.vercelignore`: يمنع رفع ملفات محلية أو ضخمة لا يحتاجها النشر مثل النوتبوكات والداتا وملفات build.

## مسار التشغيل

1. المستخدم يدخل بيانات المريض من واجهة Next.js.
2. الواجهة ترسل البيانات إلى `/api/predict` على نفس الدومين.
3. FastAPI يحول `gender` و `physical_activity` إلى قيم رقمية.
4. FastAPI يحسب `cholesterol_ratio = LDL / HDL`.
5. يتم بناء صف بيانات بنفس ترتيب أعمدة التدريب.
6. النموذج يرجع احتمالية مقاومة الإنسولين والتصنيف والثقة.
7. الواجهة تعرض النتيجة ونسبة `LDL / HDL` واحتمالات الفئتين.

## مسارات الـ API

- `/`: يعرض حالة الخدمة وروابط المسارات المهمة.
- `/api`: نفس حالة الخدمة.
- `/api/health`: اختبار سريع أن الباك يعمل وأن ملف النموذج موجود.
- `/api/predict`: مسار التوقع المستخدم من واجهة Next.js.

## أعمدة النموذج

```text
age
gender_encoded
BMI
fasting_glucose
HbA1c
insulin
triglycerides
blood_pressure
physical_activity_encoded
cholesterol_ratio
```

ترتيب الأعمدة في `HOMI-IR (1).ipynb` و `UI.ipynb` و `backend/main.py` متوافق.

## ملاحظات على المشكلة التي تم إصلاحها

- تم جعل أمثلة الواجهة تشغل التوقع مباشرة بعد تغيير القيم.
- عند تعديل أي قيمة يدويا يتم مسح النتيجة القديمة حتى لا تظهر أرقام ثابتة من طلب سابق.
- تم جعل Vercel يستخدم `api/index.py` كنقطة دخول للـ FastAPI بدلا من الاعتماد المباشر على `backend/main.py`.
- تم التأكد أن النموذج يعمل مع `scikit-learn==1.7.1` وأنه محفوظ كـ `Pipeline` يحتوي على `StandardScaler` و `LogisticRegression`.

## التشغيل المحلي

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

عند تشغيل الواجهة محليا مع Backend منفصل، يمكن إنشاء ملف:

`frontend/.env.local`

بالقيمة:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

في Vercel لا تحتاج هذه القيمة إذا تم نشر المشروع من جذر المستودع واستخدام `vercel.json`.

## النشر على Vercel

1. ارفع المشروع إلى GitHub.
2. في Vercel اجعل Root Directory هو جذر المشروع، وليس `frontend` فقط.
3. تأكد أن ملفات `frontend/node_modules` و `frontend/.next` غير مرفوعة إلى GitHub.
4. Vercel سيستخدم `vercel.json` لتوجيه:
   - `/api/*` إلى FastAPI.
   - باقي الصفحات إلى Next.js.
5. بعد النشر اختبر:
   - `https://YOUR-DOMAIN.vercel.app/api/health`
   - `https://YOUR-DOMAIN.vercel.app`

## تشغيل محلي قابل للمشاركة داخل نفس الشبكة

Backend:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```bash
cd frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

بعدها يمكن فتح الواجهة من جهاز آخر على نفس الشبكة باستخدام IP جهازك، مثل:

```text
http://YOUR-LAN-IP:3000
```

أما المشاركة العامة على الإنترنت فتكون من رابط Vercel بعد النشر.

## تنبيه طبي

هذا النموذج مساعد بحثي ولا يغني عن التقييم الطبي المتخصص أو القرار السريري.

</div>
