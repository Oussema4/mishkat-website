import type { ContentItem, FaqItem, HowToStep } from "./schema";

/**
 * Initial catalogue. Only facts confirmed by Mishkat (price, contents, age) and
 * the printed rules sheet are used here. Everything stays editable from /admin.
 */
export const SEED_CATEGORY = { slug: "educational-games", name: "ألعاب تعليمية", sortOrder: 1 };

export const SABILI = {
  slug: "sabili",
  name: "سبيلي",
  tagline: "لعبة بطاقات أسئلة إسلامية للعائلة والأصدقاء",
  shortDescription:
    "125 بطاقة سؤال في العقيدة والقرآن والفقه والسيرة والتاريخ الإسلامي، بمستويين: ملوّنة سهلة وصفراء أصعب.",
  description: [
    "سبيلي لعبة بطاقات تجمع العائلة والأصدقاء حول أسئلة في دينهم. كل لاعب يسحب بطاقة ويطرح سؤالها على من بجانبه، ومع كل جولة تزيد الصعوبة ويكبر التحدي.",
    "الأسئلة موزّعة على خمسة مجالات: العقيدة، القرآن، الفقه، السيرة النبوية، والتاريخ الإسلامي. البطاقات الملوّنة للأسئلة السهلة، والصفراء للأسئلة الأصعب.",
    "وفي النهاية لا يخرج الفائز بالنقاط فقط: يوزّع على الخاسرين بطاقات «حسنة» و«موعظة»، فيصير اللعب نفسه عملًا تؤجر عليه.",
  ].join("\n\n"),
  price: 48000,
  compareAtPrice: 59000,
  stock: 100,
  ageRange: "9 سنوات فما فوق",
  players: "",
  contents: [
    { label: "بطاقات الأسئلة", value: "125 بطاقة: ملوّنة (أسئلة سهلة) وصفراء (أسئلة أصعب)" },
    { label: "مجالات الأسئلة", value: "عقيدة، قرآن، فقه، سيرة، تاريخ إسلامي" },
    { label: "بطاقات الفوز", value: "بطاقات «حسنة» وبطاقات «موعظة» (إضافة على الـ125 بطاقة)" },
    { label: "قواعد اللعبة", value: "ورقة مطبوعة تشرح المراحل وطريقة احتساب النقاط" },
  ] satisfies ContentItem[],
  howToPlay: [
    {
      title: "المرحلة الأولى",
      body: "كل لاعب يسحب 4 بطاقات ملوّنة. يبدأ اللاعب الأكبر سنًّا ويطرح سؤالًا على من هو على يمينه. إن كانت الإجابة صحيحة يحتفظ بالبطاقة، وإن كانت خاطئة توضع البطاقة جانبًا. ويستمر اللعب حتى تنتهي كل البطاقات.",
    },
    {
      title: "المرحلة الثانية",
      body: "كل لاعب يسحب 3 بطاقات ملوّنة وبطاقة صفراء واحدة. تزداد الصعوبة بإضافة البطاقة الصفراء.",
    },
    {
      title: "المرحلة الثالثة",
      body: "كل لاعب يسحب بطاقتين ملوّنتين وبطاقتين صفراوين.",
    },
    {
      title: "المرحلة النهائية",
      body: "كل لاعب يحسب نقاطه: كل بطاقة ملوّنة صحيحة = 10 نقاط (10 ثوانٍ للإجابة)، وكل بطاقة صفراء صحيحة = 30 نقطة (35 ثانية للإجابة). يتأهّل اللاعبان صاحبا أعلى النقاط إلى التحدي النهائي، ويتبادلان الأسئلة بالترتيب: عقيدة، قرآن، فقه، سيرة، تاريخ، الملوّنة ثم الصفراء. إن أجابا معًا خطأً أو معًا صوابًا ينتقلان إلى جولة جديدة، وإن أجاب أحدهما فقط إجابة صحيحة يفوز وتنتهي اللعبة.",
    },
    {
      title: "بعد الفوز",
      body: "الفائز يوزّع بطاقة «حسنة» أو بطاقة «موعظة» على اللاعبين الخاسرين.",
    },
    {
      title: "ألقاب النقاط",
      body: "أقل من 60: مبتدئ · أكثر من 60: مقدام · أكثر من 100: مغوار · أكثر من 130: صنديد · 220 فما فوق: بطل الأبطال.",
    },
  ] satisfies HowToStep[],
  benefits: [
    "تتعلّم معلومات في خمسة مجالات: العقيدة، القرآن، الفقه، السيرة، والتاريخ الإسلامي.",
    "كل سؤال يفتح نقاشًا: من يعرف القصة يحكيها للبقية.",
    "تجمع الكبار والصغار (من 9 سنوات) حول طاولة واحدة، بعيدًا عن الشاشات.",
    "مستويان من الصعوبة يجعلان التحدي يكبر من مرحلة إلى أخرى.",
    "بطاقات الحسنة والموعظة تحوّل نهاية اللعبة إلى عمل صالح.",
  ],
  faq: [
    { q: "لأي عمر تناسب اللعبة؟", a: "من 9 سنوات فما فوق، ويلعبها الكبار والصغار معًا." },
    {
      q: "كم بطاقة في العلبة؟",
      a: "125 بطاقة سؤال (ملوّنة وصفراء)، إضافة إلى بطاقات الحسنة والموعظة وورقة القواعد.",
    },
    {
      q: "ما الفرق بين البطاقات الملوّنة والصفراء؟",
      a: "الملوّنة أسئلة سهلة (10 نقاط، 10 ثوانٍ للإجابة)، والصفراء أسئلة أصعب (30 نقطة، 35 ثانية للإجابة).",
    },
    {
      q: "كيف يُحدَّد الفائز؟",
      a: "بعد المراحل الثلاث يتأهّل صاحبا أعلى النقاط إلى تحدٍّ نهائي، ومن يجيب وحده إجابة صحيحة يفوز.",
    },
  ] satisfies FaqItem[],
  featured: true,
  sortOrder: 1,
  images: [
    { url: "/images/products/sabili-box.webp", alt: "علبة لعبة سبيلي الزرقاء بشعارها الذهبي" },
    { url: "/images/products/sabili-table.webp", alt: "علبة سبيلي وبطاقاتها الملوّنة على طاولة" },
    { url: "/images/products/sabili-cards.webp", alt: "بطاقات سبيلي: الملوّنة والصفراء وبطاقتا الحسنة والموعظة" },
    { url: "/images/products/sabili-hand.webp", alt: "علبة سبيلي في اليد" },
    { url: "/images/products/sabili-rules-1.webp", alt: "ورقة قواعد اللعبة: أنواع البطاقات ومراحل اللعب" },
    { url: "/images/products/sabili-rules-2.webp", alt: "ورقة قواعد اللعبة: المرحلة النهائية والنقاط" },
  ],
};

// [file, width, height] of each prepared image in public/images/reviews (messages only, no photos)
const REVIEW_FILES = [
  ["review-01-msg", 720, 213], ["review-02-msg", 440, 380], ["review-03", 720, 393], ["review-04", 720, 160],
  ["review-05", 720, 304], ["review-06", 720, 405], ["review-07", 720, 583], ["review-08", 720, 332],
  ["review-09-msg", 562, 348], ["review-10-msg", 612, 270], ["review-11", 720, 481], ["review-12", 720, 693],
  ["review-13-msg", 720, 556],
] as const;

export const SEED_REVIEWS = REVIEW_FILES.map(([file, width, height], i) => ({
  imageUrl: `/images/reviews/${file}.webp`,
  width,
  height,
  alt: "رسالة من أحد عملاء مشكاة عن لعبة سبيلي",
  sortOrder: i + 1,
}));

/**
 * Reviews whose screenshot was re-cropped to the message only (attached photos removed).
 * The seed moves existing rows from the old file to the new one, so already-seeded databases follow.
 */
export const REVIEW_REPLACEMENTS = [1, 2, 9, 10, 13].map((n) => {
  const old = `/images/reviews/review-${String(n).padStart(2, "0")}.webp`;
  const next = SEED_REVIEWS[n - 1];
  return { from: old, to: next.imageUrl, width: next.width, height: next.height };
});
