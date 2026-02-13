# UML Diagram Editor (Text-to-Diagram Studio)

**[English](#english) | [فارسی](#persian)**

---

<a name="english"></a>
## 🇬🇧 English Description

**UML Diagram Editor** is a modern, modular web application that converts simple text descriptions into professional SVG diagrams instantly. Inspired by tools like Mermaid.js and Draw.io, it features a custom rendering engine built from scratch to ensure beautiful, orthogonal routing and collision-free layouts.

> **Repo:** [https://github.com/WASP-Outis/uml-diagram-editor](https://github.com/WASP-Outis/uml-diagram-editor)

### ✨ Key Features

- **4 Major Diagram Types:**
  - **Use Case:** Actors, Use Cases, Associations (Sync/Async).
  - **Sequence:** Participants, Messages, Activations, Self-messages.
  - **Class:** Classes (methods/attributes), Inheritance, Composition, Aggregation.
  - **State Machine:** States, Transitions, Start/End nodes.

- **Smart Rendering Engine:**
  - **Orthogonal Routing:** Arrows automatically find the best path using Manhattan geometry (90-degree turns) without crossing through nodes.
  - **Collision Avoidance:** Smart placement of labels and lines to prevent overlap.
  - **Inheritance-Aware Layout:** Class diagrams automatically arrange themselves based on hierarchy.

- **Persian & RTL Support:**
  - Fully integrated with **Vazirmatn** font.
  - Automatic detection of Persian text to adjust text direction (`rtl`) and anchors.

- **Production Ready:**
  - **Export:** Download diagrams as high-quality **SVG** or **PNG**.
  - **Live Preview:** Real-time rendering as you type.
  - **Customization:** Adjustable stroke width and primary colors.

### 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/WASP-Outis/uml-diagram-editor.git
   cd uml-diagram-editor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

### 📝 Syntax Guide

Please refer to the **[SYNTAX_GUIDE.md](./SYNTAX_GUIDE.md)** for a complete reference on how to write diagrams.

**Quick Example (State Machine):**
```txt
[*] -> [Idle]
[Idle] -> [Active]: start
[Active] -> [Paused]: hold
[Paused] -> [Active]: resume
[Active] -> [*]: done
```

---

<a name="persian"></a>
## 🇮🇷 توضیحات فارسی

**ویرایشگر نمودار UML** یک ابزار تحت وب مدرن است که توضیحات متنی ساده را به صورت آنی به نمودارهای استاندارد و زیبا تبدیل می‌کند. این پروژه با الهام از Mermaid.js و Draw.io ساخته شده، اما از یک **موتور رندر اختصاصی** استفاده می‌کند تا خطوط و فلش‌ها به صورت هوشمند و بدون تداخل رسم شوند.

### ✨ ویژگی‌های کلیدی

- **پشتیبانی از ۴ نوع نمودار اصلی:**
  - **Use Case:** اکتورها، یوزکیس‌ها و روابط.
  - **Sequence:** پیام‌های همگام/ناهمگام، Activation bar و پیام‌های بازگشتی.
  - **Class:** کلاس‌ها (ویژگی‌ها/متدها)، ارث‌بری، ترکیب (Composition) و تجمیع (Aggregation).
  - **State Machine:** وضعیت‌ها، انتقال‌ها (Transitions) و نقاط شروع/پایان.

- **موتور رندر هوشمند (Smart Rendering):**
  - **مسیریابی Orthogonal:** خطوط به صورت خودکار با زاویه‌های ۹۰ درجه رسم می‌شوند (Manhattan Geometry).
  - **جلوگیری از برخورد:** الگوریتم‌های پیشرفته برای جلوگیری از عبور خطوط از روی متن‌ها و باکس‌ها.
  - **چیدمان خودکار:** نمودارهای کلاس بر اساس روابط ارث‌بری به صورت لایه‌ای مرتب می‌شوند.

- **پشتیبانی کامل از فارسی (RTL):**
  - استفاده از فونت محبوب **وزیرمتن (Vazirmatn)**.
  - تشخیص خودکار متن فارسی و تنظیم جهت متن (`rtl`) و تراز‌بندی صحیح.

- **امکانات کاربردی:**
  - **خروجی:** دانلود نمودار با فرمت **SVG** (برداری) و **PNG** (تصویری).
  - **پیش‌نمایش زنده:** مشاهده تغییرات همزمان با تایپ کردن.
  - **شخصی‌سازی:** تغییر رنگ اصلی و ضخامت خطوط.

### 🚀 راهنمای نصب و اجرا

۱. **دریافت پروژه:**
   ```bash
   git clone https://github.com/WASP-Outis/uml-diagram-editor.git
   cd uml-diagram-editor
   ```

۲. **نصب وابستگی‌ها:**
   ```bash
   npm install
   ```

۳. **اجرای برنامه:**
   ```bash
   npm run dev
   ```

۴. مرورگر را باز کنید و به آدرس `http://localhost:5173` بروید.

### 📝 راهنمای سینتکس (دستورات)

برای مشاهده کامل دستورات و مثال‌ها، فایل **[SYNTAX_GUIDE.md](./SYNTAX_GUIDE.md)** را مطالعه کنید.

**مثال سریع (نمودار کلاس):**
```txt
class کاربر {
+نام: string
+ورود(): boolean
}

class ادمین {
+سطح_دسترسی: int
}

کاربر <|-- ادمین
```
