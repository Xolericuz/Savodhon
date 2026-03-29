const DB = {
    "A": {
        step1: ["A-ka", "A-or", "A-ra", "A-na", "A-to", "A-yiq"],
        step2: ["A-nor", "A-lo-qa", "A-ra-va", "A-za-mat", "A-lif-bo", "A-dras"],
        step3: ["Av-to-mo-bil", "A-ra-la-shuv", "A-sos-la-moq", "A-niq-la-ma", "Ax-bo-ro", "A-yov-siz"],
        step4: ["A-ka-de-mi-ya", "A-vi-a-tsi-ya", "A-gro-nom", "A-do-lat-li", "A-dras-mon", "A-ziz-lik"],
        step5: ["A-sos-chi-lar", "A-yov-siz-lik", "An-a-na-viy", "A-ha-mi-yat", "A-niq-lik-lar", "Ak-tyor-lar"],
        step6: ["A-vi-a-tsi-ya-chi", "A-ka-de-mik-lar", "A-sos-lan-ma-gan", "A-ha-mi-yat-siz", "A-ra-lash-ti-rish", "A-chi-nar-li-ro"]
    },
    "B": {
        step1: ["Bo-la", "Bo-bo", "Bu-vi", "Bo-g'i", "Be-da", "Ba-ho"],
        step2: ["Ba-liq", "Bi-lim", "Ba-ho-dir", "Be-mor", "Ba-ra-ka", "Bay-ram"],
        step3: ["Bosh-lan-g'ichi", "Bi-la-gu-zuk", "Ba-qa-te-rak", "Buz-g'un-chi", "Boy-la-moq", "Be-g'u-bor"],
        step4: ["Ba-ra-ka-li", "Bi-lim-don", "Be-min-nat", "Ba-ho-la-moq", "Bu-loq-lar", "Be-va-fo"],
        step5: ["Bi-lim-don-lik", "Ba-qa-te-rak-lar", "Bo-yo-vut-lik", "Be-to-qat-lik", "Bosh-lan-ma-gan", "Buy-ruq-boz"],
        step6: ["Bi-la-gu-zuk-siz", "Buz-g'un-chi-lik", "Ba-ho-dir-lik-lar", "Bosh-bo-shiq-lik", "Be-pa-ro-sat-lik", "Bay-ram-o-na"]
    }
};

const CATEGORIES = {
    "Hayvonlar": {
        step1: ["Ayiq", "Bo'zuyri", "Tulki", "Quyon", "Kiyik", "Sher"],
        step2: ["Fil", "Jirafа", "Mayмun", "Yo'lbars", "Zebra", "Karkidon"],
        step3: ["Timsoh", "Begemot", "Nosorogi", "Gorilla", "Shimpanze", "Lemur"],
        step4: ["Delfini", "Kit", "Akula", "Sakkizoyoq", "Dengiz toshabaqasi", "Morj"],
        step5: ["Qoplon", "Ilon", "Kaltakesak", "Buqa", "Sigir", "Qo'y"],
        step6: ["Tovuq", "Xo'zroz", "O'rdak", "Guyrozi", "Kaptar", "Burut"]
    }
};

// Export untuk digunakan di app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DB, CATEGORIES };
}
