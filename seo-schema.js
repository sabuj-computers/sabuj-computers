/* ============================================================
   SEO: JSON-LD Structured Data Loader
   Alada file e rakha hoyeche jate home.html boro na hoy.
   Eta page load er shathe shathe schema inject kore <head> e.
   Googlebot, Bing — shobai eta read kore (sitelinks & rich snippets).
   ============================================================ */
(function () {
  var schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://sabujcomputers.pro.bd/#organization",
        "name": "সবুজ কম্পিউটার্স ট্রেনিং সেন্টার",
        "alternateName": ["Sabuj Computers", "Sabuj Computers Training Center", "SCTC"],
        "url": "https://sabujcomputers.pro.bd/",
        "logo": "https://sabujcomputers.pro.bd/icon-512.png",
        "image": "https://sabujcomputers.pro.bd/icon-512.png",
        "description": "সবুজ কম্পিউটার্স ট্রেনিং সেন্টার - কম্পিউটার, গ্রাফিক্স ডিজাইন, ওয়েব ডেভেলপমেন্ট ও অফিস অ্যাপ্লিকেশন কোর্স। সরকার অনুমোদিত কম্পিউটার প্রশিক্ষণ কেন্দ্র।",
        "foundingDate": "2015",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "BD",
          "addressRegion": "Bangladesh"
        },
        "sameAs": ["https://www.facebook.com/sabujcomputers"]
      },
      {
        "@type": "WebSite",
        "@id": "https://sabujcomputers.pro.bd/#website",
        "url": "https://sabujcomputers.pro.bd/",
        "name": "সবুজ কম্পিউটার্স",
        "publisher": { "@id": "https://sabujcomputers.pro.bd/#organization" },
        "inLanguage": "bn-BD",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://sabujcomputers.pro.bd/verify.html?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "ItemList",
        "@id": "https://sabujcomputers.pro.bd/#sitelinks",
        "name": "প্রধান সেবাসমূহ",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "স্টুডেন্ট পোর্টাল",
            "description": "শিক্ষার্থীদের লগইন, রেজাল্ট, আইডি কার্ড ও সার্টিফিকেট ডাউনলোড",
            "url": "https://sabujcomputers.pro.bd/portal.html"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "ভর্তি ফরম",
            "description": "অনলাইনে ভর্তি আবেদন ও ফরম পূরণ",
            "url": "https://sabujcomputers.pro.bd/admission-form.html"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "সার্টিফিকেট যাচাই",
            "description": "সার্টিফিকেট ও রেজিস্ট্রেশন নাম্বার দিয়ে অনলাইন যাচাই",
            "url": "https://sabujcomputers.pro.bd/verify.html"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "অ্যাটেনডেন্স",
            "description": "শিক্ষার্থী ও কর্মচারীদের উপস্থিতি ব্যবস্থাপনা",
            "url": "https://sabujcomputers.pro.bd/attendance.html"
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://sabujcomputers.pro.bd/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "হোম",
            "item": "https://sabujcomputers.pro.bd/"
          }
        ]
      }
    ]
  };

  try {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(schema);
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    /* silent fail — SEO only */
  }
})();
