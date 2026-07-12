const dictionary = {
    en: {
        title: "HW Lite Inspector",
        subtitle: "Advanced stats analysis mod for Hero Wars Web/FB",
        installBtn: "Install Script",
        sourceBtn: "View Source",
        featuresTitle: "Key Features",
        feat1Title: "Deep Stats",
        feat1Desc: "Reveals hidden values and full hero attributes in Lobby and Battles. Calculates exact Auto-Attack damage.",
        feat2Title: "Damage Matrix",
        feat2Desc: "Calculates exact physical and magical damage reductions between targets (Target OUT / Target IN).",
        feat3Title: "Calculator",
        feat3Desc: "Adjust Armor, Magic Resist, and Penetration on the fly to see how it affects damage scaling.",
        installTitle: "How to Install",
        step1: "Install a userscript manager like",
        step2: "Click the \"Install Script\" button above.",
        step3: "Confirm the installation in the userscript manager tab.",
        step4: "Refresh your Hero Wars game page. The panel will appear in the top left corner!"
    },
    ru: {
        title: "HW Инспектор Статов",
        subtitle: "Мод для детального анализа статов в Хрониках Хаоса (Web/FB)",
        installBtn: "Установить скрипт",
        sourceBtn: "Исходный код",
        featuresTitle: "Возможности",
        feat1Title: "Скрытые статы",
        feat1Desc: "Показывает скрытые значения и полные характеристики героев в лобби и боях. Считает урон автоатаки.",
        feat2Title: "Матрица Урона",
        feat2Desc: "Рассчитывает точные порезки физического и магического урона между целями (Урон ПО цели / Урон ОТ цели).",
        feat3Title: "Калькулятор",
        feat3Desc: "Изменяйте Броню, Защиту от магии и Пробивы прямо в панели, чтобы увидеть, как изменится проходящий урон.",
        installTitle: "Как установить",
        step1: "Установите расширение для скриптов, например",
        step2: "Нажмите кнопку «Установить скрипт» выше.",
        step3: "Подтвердите установку в открывшейся вкладке Tampermonkey.",
        step4: "Обновите страницу с игрой. Панель появится в левом верхнем углу!"
    }
};

let currentLang = 'en';

function initLanguage() {
    // Проверяем, есть ли сохраненный выбор в localStorage
    const savedLang = localStorage.getItem('site_lang');
    
    if (savedLang) {
        currentLang = savedLang;
    } else {
        // Определяем язык браузера/локации (если начинается с ru, be, uk, kk - ставим русский)
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('ru') || browserLang.startsWith('be') || browserLang.startsWith('uk') || browserLang.startsWith('kk')) {
            currentLang = 'ru';
        } else {
            currentLang = 'en';
        }
    }
    applyLanguage(currentLang);
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang] && dictionary[lang][key]) {
            el.innerHTML = dictionary[lang][key]; // innerHTML позволяет вставлять ссылки внутри текста
        }
    });

    document.getElementById('lang-toggle').innerText = lang === 'en' ? 'EN / RU' : 'RU / EN';
}

document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ru' : 'en';
    localStorage.setItem('site_lang', currentLang);
    applyLanguage(currentLang);
});

// Запуск при загрузке
initLanguage();
