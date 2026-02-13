# Diagram DSL Spec (برای AI و انسان)

این سند «نسخه دقیق و بدون ابهام» سینتکس DSL همین نرم افزار است.  
اگر قرار است یک AI متن نمودار تولید کند، باید فقط از همین قواعد استفاده کند.

---

## 1) چرا بعضی ورودی ها خطا می دهند؟

این برنامه **PlantUML / Mermaid کامل** را parse نمی کند.  
فقط DSL داخلی خودش را می فهمد.

نمونه هایی که **پشتیبانی نمی شوند**:

- `actor Customer`
- `usecase "..." as UC1`
- `UC5 ..> UC7 : <<include>>`
- خطوطی مثل `Parser Status` یا متن توضیحی خارج از DSL

پس ورودی شما که به سبک PlantUML بود، طبیعی است که با `could not parse` رد شود.

---

## 2) قوانین طلایی (MUST)

- هر خط = یک دستور معتبر DSL
- فقط یکی از 4 نوع نمودار را در هر ورودی بنویس
- بین خطوط آزادانه خط خالی بگذار
- کامنت مجاز:
  - `// comment`
  - `# comment`
- نام ها می توانند فارسی/انگلیسی باشند
- خروجی AI باید فقط کد خام باشد (بدون توضیح متنی اضافه)

---

## 3) قواعد طلایی مخصوص AI

اگر این فایل را به AI می دهی، این Rule را کنار آن بده:

```txt
فقط DSL معتبر تولید کن.
از سینتکس PlantUML/Mermaid استفاده نکن.
هیچ متن توضیحی، تیتر، bullet یا Parser Status ننویس.
فقط یک نوع نمودار در هر خروجی تولید کن.
```

---

## 4) گرامر خلاصه DSL

### 4.1 Use Case

```txt
<Actor> -> (<UseCase>)
<Actor> --> (<UseCase>)
```

### 4.2 Sequence

```txt
<Sender> -> <Receiver>: <Message>
<Sender> --> <Receiver>: <Message>
activate <Participant>
deactivate <Participant>
```

### 4.3 Class

```txt
class <Name> { <member>; <member>; ... }
```

یا:

```txt
class <Name> {
<member>
<member>
}
```

و روابط:

```txt
<A> <|-- <B>
<A> *-- <B>
<A> o-- <B>
<A> -- <B>
```

### 4.4 State Machine

```txt
[<StateA>] -> [<StateB>]
[<StateA>] --> [<StateB>]
[<StateA>] -> [<StateB>]: <Label>
[*] -> [<State>]
[<State>] -> [*]: <Label>
```

---

## 5) Use Case (دقیق)

### فرمت مجاز

```txt
Customer -> (Register)
Customer --> (Pay Online)
```

### نکته مهم

- در Use Case این نسخه، تعریف جداگانه `actor` یا `usecase` نداریم.
- Actor و UseCase همان لحظه از روی رابطه ساخته می شوند.
- پس باید مستقیم رابطه بنویسی.

### مثال فارسی

```txt
مشتری -> (ثبت نام و ورود)
مشتری -> (جستجوی رستوران)
مشتری -> (ثبت سفارش)
مشتری --> (پرداخت آنلاین)
```

---

## 6) Sequence (دقیق)

### فرمت پیام

```txt
Alice -> Bob: Hello
Bob --> Alice: Ack
```

### Activation

```txt
activate Bob
deactivate Bob
```

### خطای رایج

- `deactivate X` بدون `activate X` قبلی -> خطا

### مثال کامل

```txt
Alice -> Bob: Start
activate Bob
Bob -> Bob: Validate
Bob --> Alice: Done
deactivate Bob
```

---

## 7) Class (دقیق)

### کلاس تک خطی

```txt
class User { +name: string; +login(password: string): boolean }
```

### کلاس چندخطی

```txt
class User {
+name: string
+login(password: string): boolean
}
```

### روابط پشتیبانی شده

```txt
Parent <|-- Child
Whole *-- Part
Container o-- Element
A -- B
```

- `<|--` = Inheritance (مثلث توخالی)
- `*--` = Composition (diamond پر)
- `o--` = Aggregation (diamond توخالی)
- `--` = Association

### مثال

```txt
class کاربر {
+نام: string
+ورود(رمز: string): boolean
}

class Admin {
+role: string
+banUser(id: number): void
}

class Profile {
+bio: string
}

class Permission {
+code: string
}

کاربر <|-- Admin
کاربر *-- Profile
Admin o-- Permission
```

---

## 8) State Machine (دقیق)

### فرمت

```txt
[*] -> [Idle]
[Idle] -> [Active]: start
[Active] -> [Paused]: hold
[Paused] -> [Active]: resume
[Active] -> [*]: done
```

### نکات

- State باید داخل براکت باشد: `[State]`
- start/end با `[*]`
- label بعد از `:`

---

## 9) تبدیل PlantUML به DSL این پروژه

### ورودی PlantUML (پشتیبانی نمی شود)

```txt
actor Customer
usecase "ثبت سفارش" as UC5
Customer --> UC5
UC5 ..> UC7 : <<include>>
```

### خروجی معادل DSL (پشتیبانی می شود)

```txt
Customer --> (ثبت سفارش)
Customer --> (پرداخت آنلاین)
Customer --> (استفاده از کد تخفیف)
```

### قانون تبدیل

- `actor X` -> حذف شود
- `usecase "..." as UCx` -> فقط متن داخل کوتیشن را نگه دار
- `Customer --> UCx` -> `Customer --> (<resolved label>)`
- `..>` و `<<include>>` و `<<extend>>` در Use Case فعلی پشتیبانی نمی شوند

---

## 10) بازنویسی نمونه شما به DSL معتبر

کد پیشنهادی معتبر برای مثال شما:

```txt
Customer --> (ثبت‌نام و ورود)
Customer --> (جستجوی رستوران)
Customer --> (مشاهده منو و جزئیات)
Customer --> (افزودن به سبد خرید)
Customer --> (ثبت سفارش)
Customer --> (رزرو میز)
Customer --> (پرداخت آنلاین)
Customer --> (پیگیری وضعیت سفارش)
Customer --> (لغو سفارش)
Customer --> (ویرایش سفارش)
Customer --> (لغو رزرو)
Customer --> (تغییر رزرو)
Customer --> (ثبت نظر و امتیاز)
Customer --> (مشاهده تاریخچه)
Customer --> (استفاده از کد تخفیف)
Customer --> (مدیریت آدرس‌ها)
```

---

## 11) چه چیزهایی عمدا پشتیبانی نمی شوند (نسخه فعلی)

- تعریف actor/usecase به سبک PlantUML
- Alias با `as`
- dependency با `..>`
- `<<include>>` و `<<extend>>` در Use Case
- بسته های چندنموداری در یک فایل
- متن توضیحی غیر DSL بین خطوط

---

## 12) خطاهای Parser Status و علت

- `could not parse "..."`  
  خط با هیچ قاعده DSL مچ نشده است.

- `deactivate without matching activate`  
  deactivate بدون activate قبلی در Sequence.

- `Unclosed class block`  
  در Class، `}` جا افتاده است.

---

## 13) چک لیست ضد خطا قبل از اجرا

- فقط یک نوع نمودار نوشتی؟
- هیچ خطی با `actor` یا `usecase` شروع نشده؟
- برای Use Case از پرانتز استفاده کردی؟ `(UseCase)`
- در Sequence برای پیام `:` گذاشتی؟
- در State از براکت `[]` استفاده کردی؟
- در Class همه بلاک ها با `}` بسته شده؟

---

## 14) قالب آماده برای Prompt به AI

```txt
You generate DSL for Text-to-Diagram Studio.
Output only raw DSL code with no explanations.
Use exactly one diagram type.
Do not use PlantUML/Mermaid keywords like actor, usecase, as, ..>, <<include>>, <<extend>>.
For use cases, always write: Actor --> (Use Case Name)
```

---

## 15) Export

- از Toolbar:
  - `SVG` خروجی برداری
  - `PNG` خروجی تصویری
- نام فایل خروجی: `diagram-<type>`

