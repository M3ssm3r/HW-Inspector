// ==UserScript==
// @name         HW Lite Inspector
// @name:ru      HW Инспектор статов
// @namespace    http://tampermonkey.net/
// @version      2.4.4
// @description  Hero Wars stats inspecto
// @description-ru Хроники Хаоса Инспектор Статов
// @author       Messmer discord: m3ssmer
// @match        *://*.hero-wars-alliance.com/*
// @match        *://hero-wars-alliance.com/*
// @match        *://*.nextersglobal.com/*
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==

(function() {
    if (!window._hwIptFix) {
        window._hwIptFix = true;
        ["keydown", "keyup", "keypress"].forEach(ev => {
            window.addEventListener(ev, e => {
                if (e.target && e.target.tagName === "INPUT" && e.target.closest("#hw-lite-inspector")) {
                    e.stopImmediatePropagation();
                }
            }, true);
        });
    }

    const HW_DIV = 3000;

    // Внедряем чистый CSS через Constructable Stylesheets (Полный обход CSP)
    const HW_EXT_CSS = `
        #hw-lite-inspector {
            position: fixed; top: 15px; left: 15px; z-index: 999999;
            width: 460px; min-width: 400px; height: 500px; min-height: 120px;
            background: #111111;
            color: #d1d1d1;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            box-shadow: 0 0 10px #000, inset 0 0 20px rgba(0,0,0,0.9);
            display: flex; flex-direction: column; overflow: hidden;
            font-family: Arial, Helvetica, sans-serif;
            resize: both;
        }

        @keyframes hwGoldPulse {
            0% { box-shadow: 0 0 5px #ffd100; border-color: #ffd100; }
            50% { box-shadow: 0 0 15px #ffd100; border-color: #fffed1; }
            100% { box-shadow: 0 0 5px #ffd100; border-color: #ffd100; }
        }

        #hw-lite-inspector.minimized {
            width: 150px !important; height: 38px !important;
            min-width: 0 !important; min-height: 0 !important;
            resize: none !important; padding: 0 !important;
            animation: hwGoldPulse 2s infinite;
        }

        .hw-header {
            position: sticky; top: 0; z-index: 1001;
            background: linear-gradient(to bottom, #2b2b2b, #111);
            padding: 8px 12px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #000;
            cursor: move; user-select: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }

        #hw-lite-inspector.minimized .hw-header { border-bottom: none; padding: 10px; background: #111; }

        .hw-title {
            color: #ffd100; text-shadow: 1px 1px 1px #000;
            font-size: 14px; font-weight: bold; letter-spacing: 0.5px;
        }

        .hw-controls { display: flex; align-items: center; gap: 8px; }
        .hw-tabs-container { display: flex; gap: 6px; margin-right: auto; }

        .hw-tab {
            cursor: pointer; padding: 3px 8px; border-radius: 3px;
            border: 1px solid #444; font-size: 11px; font-weight: bold;
            background: #222; color: #888;
        }
        .hw-tab.active { background: #333; color: #fff; border-color: #ffd100; }
        .hw-tab.has-data { color: #4da6ff; }

        .hw-btn { cursor: pointer; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 1px #000; }
        .hw-btn-journal { font-size: 14px; }
        .hw-btn-journal.off { opacity: 0.4; filter: grayscale(100%); }
        .hw-btn-help { color: #8af; }
        .hw-btn-export { color: #00ff66; }
        .hw-btn-lang { color: #ffb000; }
        .hw-btn-min { color: #fff; }
        .hw-btn-plus { color: #ffd100; font-size: 14px; }

        .hw-content { flex: 1 1 auto; overflow-y: auto; padding: 10px; position: relative; }
        .hw-content::-webkit-scrollbar { width: 8px; }
        .hw-content::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 4px; }

        #hw-help-box {
            position: absolute; top: 10px; left: 10px; right: 10px;
            background: #111; border: 1px solid #5c4a3d; padding: 12px; z-index: 1005;
            box-shadow: 0 5px 15px rgba(0,0,0,0.9); border-radius: 4px; display: none;
            color: #ccc; font-family: sans-serif;
        }
        .hw-help-title { color: #ffd100; font-weight: bold; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; }
        .hw-help-text { font-size: 11px; line-height: 1.6; color: #bbb; }
        .hw-help-btn { margin-top: 12px; padding: 6px; width: 100%; background: #222; color: #fff; border: 1px solid #444; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 11px; }

        .hw-team-label-container {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #333; margin-top: 10px; padding-bottom: 3px;
        }
        .hw-team-label {
            font-weight: bold; font-size: 12px; text-transform: uppercase;
            text-shadow: 1px 1px 1px #000; padding-left: 6px; border-left: 3px solid transparent;
        }
        .hw-copy-btn {
            background: #222; color: #aaa; border: 1px solid #444;
            cursor: pointer; font-size: 10px; border-radius: 3px; padding: 2px 8px; font-weight: bold;
        }
        .hw-copy-btn:hover { background: #333; color: #fff; }

        .hw-hero-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 6px 8px; margin: 2px 0; background: #1a1a1a;
            border: 1px solid #2a2a2a; border-radius: 3px; cursor: pointer;
        }
        .hw-hero-row:hover { background: #222; border-color: #ffd100; }
        .hw-hero-name { color: #ffffff; font-size: 13px; font-weight: bold; }
        .hw-hero-meta { color: #aaa; font-size: 10px; font-weight: normal; margin-left: 6px; }
        .hw-hero-id { color: #777; font-size: 10px; font-weight: normal; margin-left: 4px; }
        .hw-hero-power { color: #ffd100; font-weight: bold; font-size: 13px; }
        .hw-hidden-text { color: #666; }
        .hw-preview-warn { color: #ffb000; font-weight: bold; text-align: center; margin-bottom: 6px; }

        .hw-details-box {
            padding: 10px; background: #080808; border: 1px solid #2a2a2a;
            border-top: none; margin-bottom: 8px;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
        }

        .wow-stats-container { display: flex; gap: 15px; }
        .wow-stats-col { flex: 1; }
        .wow-section-title {
            color: #ffffff; font-size: 12px; font-weight: bold;
            border-bottom: 1px solid #333; margin-bottom: 4px; padding-bottom: 2px;
            text-transform: capitalize; letter-spacing: 0.5px;
        }
        .wow-mt-8 { margin-top: 8px; }
        .wow-mt-2 { margin-top: 2px; }

        .wow-stat-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
        .wow-stat-label { color: #ffd100; }
        .wow-stat-val { color: #ffffff; font-weight: normal; }
        .wow-stat-val-main { color: #1eff00; font-weight: bold; }

        .hw-build-box {
            margin-top: 10px; padding: 6px; background: #111; border: 1px solid #222;
            border-radius: 3px; font-size: 10px; color: #aaa; text-align: left;
        }
        .hw-build-val-white { color: #fff; font-family: monospace; font-size: 11px; }
        .hw-build-val-gold { color: #ffd100; font-family: monospace; font-size: 11px; font-weight: bold; }
        .hw-build-val-purple { color: #a335ee; font-weight: bold; }

        .hw-matrix-summary { margin-top: 10px; }
        .hw-matrix-table {
            width: 100%; border-collapse: collapse; font-size: 11px;
            background: #111; border: 1px solid #333; margin-top: 8px;
        }
        .hw-matrix-th {
            padding: 4px; background: #1a1a1a; color: #fff; font-size: 10px;
            border-bottom: 1px solid #333; border-left: 1px solid #222; cursor: help;
        }
        .hw-matrix-tr { border-bottom: 1px solid #222; }
        .hw-matrix-td { padding: 4px 6px; vertical-align: middle; border-left: 1px solid #222; }
        .hw-col-name { width: 20%; font-weight: bold; color: #fff; }
        .hw-col-out { width: 40%; background: rgba(0, 255, 102, 0.04); }
        .hw-col-in { width: 40%; background: rgba(255, 77, 77, 0.04); }

        .wow-dmg-val { font-weight: bold; font-family: monospace; font-size: 12px; text-align: center; }
        .wow-phys { color: #ff5555; cursor: help; }
        .wow-mag { color: #55aaff; cursor: help; }
        .wow-dmg-sep { color: #666; padding: 0 2px; font-weight: normal; }

        .wow-substat { font-size: 9px; color: #ffd100; margin-top: 3px; display: inline-block; margin-right: 6px; background: #221c11; border: 1px solid #5c4724; border-radius: 3px; padding: 1px 3px; }
        .wow-substat-val { color: #fff; }

        summary { cursor: pointer; outline: none; list-style: none; font-size: 11px; font-weight: bold; color: #ffd100; text-align: center; text-transform: uppercase; background: #1a1a1a; padding: 4px; border: 1px solid #333; border-radius: 3px; }
        summary::-webkit-details-marker { display: none; }
        summary:hover { background: #222; }

        .hw-calc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px; padding: 6px; background: #111; border: 1px solid #333; }
        .hw-calc-input {
            width: 100%; background: #000; color: #1eff00; border: 1px solid #444;
            text-align: center; border-radius: 3px; padding: 2px; font-size: 11px; outline: none; font-weight: bold; font-family: monospace;
        }
        .hw-calc-input:focus { border-color: #ffd100; }
        .hw-calc-label { font-size: 9px; color: #ffd100; text-transform: uppercase; margin-bottom: 2px; }
    `;

    try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(HW_EXT_CSS);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } catch (e) {
        let oldStyle = document.getElementById("hw-inspector-fallback");
        if(oldStyle) oldStyle.remove();
        const styleEl = document.createElement('style');
        styleEl.id = "hw-inspector-fallback";
        styleEl.textContent = HW_EXT_CSS;
        document.head.appendChild(styleEl);
    }

    const HERO_MAP = {
        1: "Aurora", 2: "Galahad", 3: "Keira", 4: "Astaroth", 5: "Kai", 6: "Phobos", 7: "Thea", 8: "Daredevil", 9: "Heidi", 10: "Faceless",
        11: "Chabba", 12: "Arachne", 13: "Orion", 14: "Fox", 15: "Ginger", 16: "Dante", 17: "Mojo", 18: "Judge", 19: "Dark Star", 20: "Artemis",
        21: "Markus", 22: "Peppy", 23: "Lian", 24: "Cleaver", 25: "Ishmael", 26: "Lilith", 27: "Luther", 28: "Qing Mao", 29: "Dorian", 30: "Cornelius",
        31: "Jet", 32: "Helios", 33: "Lars", 34: "Krista", 35: "Jorgen", 36: "Maya", 37: "Jhu", 38: "Elmir", 39: "Ziri", 40: "Nebula",
        41: "K'arkh", 42: "Rufus", 43: "Celeste", 44: "Astrid", 45: "Satori", 46: "Martha", 47: "Andvari", 49: "Yasmine", 50: "Isaac", 51: "Xe'Sha/Morrigan",
        52: "Amira", 53: "Fafnir", 54: "Iris", 55: "Mushy", 56: "Julius", 57: "Kayla", 58: "Aidan", 59: "Cascade", 60: "Octavia", 61: "Oya",
        62: "Soleil", 63: "Lara Croft", 64: "Folio", 65: "Tempus", 66: "Turtles", 67: "Polaris", 68: "Peech", 69: "Guus", 70: "Somna",
        71: "Electra", 72: "Byrna", 73: "Drayne", 74: "Miu", 75: "Kendle", 76: "Crow", 79: "Leonel",
        500: "Sebastian", 501: "Corvus", 502: "Morrigan", 503: "Alvanor", 504: "Tristan",
        4000: "Sigurd", 4001: "Nova", 4002: "Mairi", 4003: "Hyperion",
        4004: "Vex", 4014: "Kelman", 4024: "Verdoc",
        4010: "Moloch", 4011: "Vulcan", 4012: "Ignis", 4013: "Araji",
        4020: "Angus", 4021: "Sylva", 4022: "Avalon", 4023: "Eden",
        4030: "Brustar", 4031: "Keros", 4032: "Mort", 4033: "Tenebris",
        4040: "Rigel", 4041: "Amon", 4042: "Iyari", 4043: "Solaris", 99999: "??? (Hidden Team)"
    };

    const PALETTE = ["#ff4d4d", "#4da6ff", "#00ff66", "#ffd100", "#a335ee", "#00ffff", "#ff00ff", "#aFa", "#fAa"];
    const getColor = (idx) => PALETTE[idx % PALETTE.length];

    let LANG = localStorage.getItem("hw_inspector_lang") || ((navigator.language && navigator.language.startsWith("ru")) ? "ru" : "en");
    let isHideNames = localStorage.getItem("hw_inspector_hide_names") === "true";
    let isParseJournal = localStorage.getItem("hw_inspector_parse_journal") === "true";
    let isMinimized = true;

    let activeTab = "WAIT";
    let lobbyCache = null;
    let battleCache = null;
    let lastGameResponse = null;
    let lastBHash = "";
    let lastLHash = "";

    const i18n = {
        en: {
            title: "⚔️ INSP", wait: "Waiting...", copy: "Copy", copied: "Copied", export: "EXPORT", power: "pwr",
            catBase: "Attributes", catOff: "Offense", catDef: "Defense",
            str: "Strength", agi: "Agility", int: "Intellect", hp: "Health", pa: "Phys Attack", ma: "Magic Power",
            ar: "Armor", mr: "Magic Armor", ap: "Armor Pen", mpen: "Magic Pen",
            glyphs: "Glyphs", artifacts: "Artifacts", talisman: "Talisman",
            dodge: "Dodge", crit: "Crit Chance", mcrit: "Magic Crit", crush: "Crushing", tough: "Toughness", refl: "Reflection",
            matrixSum: "Damage Matrix", calcSum: "Calculator", target: "TARGET",
            hiddenMsg: "HIDDEN", defenders: "DEFENDERS", attackers: "ATTACKERS", training: "TRAINING", enemy: "ENEMY", ally: "ALLY",
            previewNotice: "LOBBY PREVIEW: Deep stats hidden. Start battle to calc!", lobbyTab: "LOBBY", battleTab: "BATTLE",
            gTitle: "ABOUT SCRIPT", gClose: "Close",
            gText: "HW Lite Inspector v2.4.4<br><br>Deep stats analysis mod.<br>• Reveals hidden values.<br>• Calculates reductions (Damage Matrix).<br>• Allows stat adjustments (Calculator).<br><br>Auto-Attack DMG is EXACTLY equal to Physical Attack.<br><br>Developed by: Messmer",
            tblCrit: "Crit", tblMgCr: "MgCr", tblCrush: "Crush", tblDodge: "Dodge", tblTough: "Tough", tblRefl: "Refl",
            ttOut: "Damage dealt TO target. Red = Physical, Blue = Magical. 100% means full damage.",
            ttIn: "Damage received FROM target. Red = Physical, Blue = Magical. 100% means full damage.",
            ttPhys: "Physical damage scaling", ttMag: "Magical damage scaling"
        },
        ru: {
            title: "⚔️ INSP", wait: "Ожидание...", copy: "Коп-ть", copied: "ОК", export: "ЭКСПОРТ", power: "мощь",
            catBase: "Базовые", catOff: "Атака", catDef: "Защита",
            str: "Сила", agi: "Ловкость", int: "Интеллект", hp: "Здоровье", pa: "Физ. Атака", ma: "Маг. Атака",
            ar: "Броня", mr: "Маг. Защита", ap: "Проб. Брони", mpen: "Проб. Магии",
            glyphs: "Символы", artifacts: "Артефакты", talisman: "Талисман",
            dodge: "Уворот", crit: "Крит", mcrit: "Маг. Крит", crush: "Сокрушение", tough: "Стойкость", refl: "Отражение",
            matrixSum: "Матрица Урона", calcSum: "Калькулятор", target: "ЦЕЛЬ",
            hiddenMsg: "СКРЫТО", defenders: "ЗАЩИТНИКИ", attackers: "АТАКУЮЩИЕ", training: "ТРЕНИРОВКА", enemy: "ВРАГ", ally: "СОЮЗНИК",
            previewNotice: "ПРЕВЬЮ: Сервер скрывает статы до начала боя!", lobbyTab: "ЛОББИ", battleTab: "БОЙ",
            gTitle: "О СКРИПТЕ", gClose: "Закрыть",
            gText: "HW Lite Inspector v2.4.4<br><br>Мод для детального анализа статов.<br>• Показывает скрытые значения.<br>• Рассчитывает порезки (Матрица урона).<br>• Позволяет менять статы (Калькулятор).<br><br>Урон с автоатаки = ТОЧНО равен Физ. Атаке героя.<br><br>Разработано: Messmer",
            tblCrit: "Крит", tblMgCr: "М.Крит", tblCrush: "Сокруш.", tblDodge: "Уворот", tblTough: "Стойк.", tblRefl: "Отраж.",
            ttOut: "Урон, наносимый ПО цели. Красный = Физ, Синий = Маг. 100% значит без порезок.",
            ttIn: "Урон, получаемый ОТ цели. Красный = Физ, Синий = Маг. 100% значит без порезок.",
            ttPhys: "Скейл физического урона", ttMag: "Скейл магического урона"
        }
    };
    const t = (k) => i18n[LANG][k] || k;
    const getHeroName = (id) => HERO_MAP[id] || `ID[${id}]`;
    const isHero = (obj) => obj && typeof obj === "object" && typeof obj.id === "number" && (typeof obj.power === "number" || typeof obj.level === "number");
    const fmt = (num) => Math.round(num).toLocaleString('ru-RU').replace(/\u00A0/g, ' ').replace(/\s/g, ' ');

    let panel = document.getElementById("hw-lite-inspector");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "hw-lite-inspector";
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div class="hw-header" id="hw-header">
            <span class="hw-title">${t('title')}</span>
            <div class="hw-controls" id="hw-controls"></div>
        </div>
        <div class="hw-content" id="hw-content"></div>
    `;

    const header = panel.querySelector('#hw-header');
    const controls = panel.querySelector('#hw-controls');
    const content = panel.querySelector('#hw-content');

    const helpBox = document.createElement("div");
    helpBox.id = "hw-help-box";
    panel.insertBefore(helpBox, content);

    const drawHelpBox = () => {
        helpBox.innerHTML = `
            <div class="hw-help-title">${t('gTitle')}</div>
            <div class="hw-help-text">${t('gText')}</div>
            <button id="hw-help-close-btn" class="hw-help-btn">${t('gClose')}</button>
        `;
        helpBox.querySelector('#hw-help-close-btn').onclick = () => { helpBox.style.display = "none"; };
    };

    const toggleMinimize = () => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            panel.classList.add("minimized");
            content.style.display = "none";
            helpBox.style.display = "none";
        } else {
            panel.classList.remove("minimized");
            content.style.display = "block";
        }
        drawHeader();
        updateView();
    };

    const drawHeader = () => {
        controls.innerHTML = "";
        if (isMinimized) {
            controls.innerHTML = `<span class="hw-btn hw-btn-plus">[ + ]</span>`;
            controls.firstChild.onclick = toggleMinimize;
        } else {
            let tabs = document.createElement("div");
            tabs.className = "hw-tabs-container";

            const mkTab = (id, label, hasData) => {
                let btn = document.createElement("span");
                btn.className = `hw-tab ${activeTab === id ? 'active' : ''} ${hasData ? 'has-data' : ''}`;
                btn.innerText = label;
                if (hasData) btn.onclick = () => { if (activeTab !== id) { activeTab = id; updateView(); } };
                return btn;
            };
            tabs.appendChild(mkTab("LOBBY", t("lobbyTab"), lobbyCache));
            tabs.appendChild(mkTab("BATTLE", t("battleTab"), battleCache));
            controls.appendChild(tabs);

            const addBtn = (icon, cls, fn, title="") => {
                let b = document.createElement("span"); b.className = `hw-btn ${cls}`; b.innerText = icon; b.onclick = fn;
                if(title) b.title = title;
                controls.appendChild(b);
            };
            addBtn("[📓]", "hw-btn-journal" + (isParseJournal ? "" : " off"), () => {
                isParseJournal = !isParseJournal; localStorage.setItem("hw_inspector_parse_journal", isParseJournal);
                drawHeader();
            }, "Toggle Parsing Match History / Журнал");
            addBtn("[?]", "hw-btn-help", () => {
                drawHelpBox();
                helpBox.style.display = helpBox.style.display === "none" ? "block" : "none";
            });
            addBtn(isHideNames ? "[🙈]" : "[👁️]", "", () => {
                isHideNames = !isHideNames; localStorage.setItem("hw_inspector_hide_names", isHideNames);
                if (lastGameResponse) { lastLHash = ""; handleResp(lastGameResponse); } else updateView();
            });
            addBtn(`[${t("export")}]`, "hw-btn-export", exportAll);
            addBtn(`[${LANG.toUpperCase()}]`, "hw-btn-lang", () => {
                LANG = LANG === "en" ? "ru" : "en"; localStorage.setItem("hw_inspector_lang", LANG);
                drawHelpBox();
                if (lastGameResponse) { lastLHash = ""; lastBHash = ""; handleResp(lastGameResponse); } else updateView();
            });
            addBtn("[ _ ]", "hw-btn-min", toggleMinimize);
        }
    };

    drawHeader();
    drawHelpBox();
    if(isMinimized) {
        panel.classList.add("minimized");
        content.style.display = "none";
    }

    let isDrag = false, ox = 0, oy = 0, dragOverlay = null;
    header.addEventListener("mousedown", (e) => {
        if(e.target.tagName === "SPAN") return;
        isDrag = true;
        let rect = panel.getBoundingClientRect();
        ox = e.clientX - rect.left; oy = e.clientY - rect.top;
        if (!dragOverlay) {
            dragOverlay = document.createElement("div");
            dragOverlay.style.position = "fixed"; dragOverlay.style.top = "0"; dragOverlay.style.left = "0";
            dragOverlay.style.width = "100vw"; dragOverlay.style.height = "100vh";
            dragOverlay.style.zIndex = "999998"; dragOverlay.style.cursor = "move";
            document.body.appendChild(dragOverlay);
        }
        e.preventDefault(); e.stopPropagation();
    });
    window.addEventListener("mousemove", (e) => {
        if (!isDrag) return;
        panel.style.left = (e.clientX - ox) + "px"; panel.style.top = (e.clientY - oy) + "px";
        panel.style.right = "auto"; panel.style.bottom = "auto";
        e.preventDefault(); e.stopPropagation();
    }, { capture: true, passive: false });
    window.addEventListener("mouseup", (e) => {
        if (isDrag) { isDrag = false; if (dragOverlay) { dragOverlay.remove(); dragOverlay = null; } e.preventDefault(); e.stopPropagation(); }
    }, { capture: true });

    const getAllBattles = (obj, list = []) => {
        if (!obj || typeof obj !== "object") return list;
        if (obj.attackers && obj.defenders) { list.push(obj); return list; }
        for (let k in obj) {
            // Отключаем сканирование журналов, если тумблер выключен
            if (!isParseJournal && (k === "journal" || k === "replays")) continue;
            getAllBattles(obj[k], list);
        }
        return list;
    };

    const parseTeam = (data) => {
        if (!data) return [];
        if (data.units) data = data.units; else if (data.heroes) data = data.heroes;
        let waves = [];
        const extract = (m) => Object.keys(m).sort((a,b)=>a-b).map(k=>m[k]).filter(isHero).length ? Object.keys(m).sort((a,b)=>a-b).map(k=>m[k]).filter(isHero) : Object.values(m).filter(isHero);

        if (Array.isArray(data)) {
            let f = data.filter(isHero); if (f.length) return [f];
            data.forEach(i => { if(i) { if (Array.isArray(i)) { let p = i.filter(isHero); if(p.length) waves.push(p); } else if (typeof i === "object") { let p = extract(i); if(p.length) waves.push(p); } } });
        } else if (typeof data === "object") {
            if (data.id) waves.push([data]); else { let p = extract(data); if(p.length) waves.push(p); }
        }
        return waves;
    };

    const getHeroStats = (h, bArmor, bMR, bAP, bMP) => {
        bArmor = bArmor || 0; bMR = bMR || 0; bAP = bAP || 0; bMP = bMP || 0;
        if (h.isHiddenDummy) return { isPreview: true, isHiddenDummy: true, hp: 0, pa: 0, ar: 0, mr: 0, ap: 0, mpen: 0, str: 0, agi: 0, int: 0, mp: 0, dodge: 0, toughness: 0, crit: 0, mcrit: 0, crush: 0, mreflect: 0, mainStatVal: 1 };
        let isPreview = !h.strength && !h.hp && !h.physicalAttack;
        let isT = h.id >= 4000 && h.id <= 4099;
        if (isT) return { isTitan: true, isPreview, hp: h.hp||0, pa: h.physicalAttack||0, ar: Math.max(0, (h.armor||0)+bArmor), mr: Math.max(0, (h.magicResist||0)+bMR), ap: bAP, mpen: bMP, str: 0, agi: 0, int: 0, mp: 0, dodge: 0, toughness: 0, crit: 0, mcrit: 0, crush: 0, mreflect: 0, mainStatVal: 0 };

        let str = h.strength||0, agi = h.agility||0, int = h.intelligence||0;
        let hp = (h.hp||0) + str*40, ar = (h.armor||0) + agi, mr = (h.magicResist||0) + int, mp = (h.magicPower||0) + int*3;
        let dodge = h.dodge||0, toughness = h.toughness||0, crit = h.physicalCritChance||0, mcrit = h.magicCritChance||0, crush = h.crush||0, mreflect = h.magicReflect||0;
        let mainStat = "str", mainStatVal = str;
        if (agi > str && agi > int) { mainStat = "agi"; mainStatVal = agi; } else if (int > str && int > agi) { mainStat = "int"; mainStatVal = int; }
        let pa = h.physicalAttack||0; pa += agi*2 + mainStatVal;

        if (h.id === 71) { let D = ar+mr+dodge; hp += (D/1000)*(0.1*hp+12000); ar=0; mr=0; dodge=0; } else { ar = Math.max(0, ar+bArmor); mr = Math.max(0, mr+bMR); }
        let ap = Math.max(0, (h.armorPenetration||0)+bAP), mpen = Math.max(0, (h.magicPenetration||0)+bMP);
        return { isTitan: false, isPreview, str, agi, int, hp, ar, mr, pa, mp, ap, mpen, dodge, toughness, crit, mcrit, crush, mreflect, mainStatVal, mainStatName: mainStat };
    };

    const calcRel = (stat, eMainStat) => stat > 0 ? ((stat / (stat + eMainStat)) * 100).toFixed(0) + "%" : null;

    const generateTextForTeam = (data, label, oppTeam) => {
        let waves = parseTeam(data); if (!waves.length) return "";
        let totalPower = 0; waves.forEach(w => w.forEach(h => totalPower += (h.power || 0)));
        let txt = [`=== ${label}${totalPower>0?` (${fmt(totalPower)} ${t('power')})`:""} ===`];
        waves.forEach((w, i) => {
            if (waves.length > 1) txt.push(`\n--- WAVE ${i+1} ---`);
            w.forEach(h => {
                if (h.isHiddenDummy) { txt.push(`👤 ??? - ${fmt(h.power)} ${t('power')}\n  [HIDDEN]`); return; }
                let s = getHeroStats(h);
                let ln = [`👤 ${getHeroName(h.id)} - ${h.power||0} ${t('power')}`];
                if (s.isPreview) ln.push(`  [PREVIEW]`);
                else if (s.isTitan) ln.push(`  HP: ${fmt(s.hp)} | PA: ${fmt(s.pa)}`);
                else {
                    ln.push(`  Int:${fmt(s.int)} | Agi:${fmt(s.agi)} | Str:${fmt(s.str)}\n  HP:${fmt(s.hp)} | PA:${fmt(s.pa)} | MA:${fmt(s.mp)}\n  Ar:${fmt(s.ar)} | MR:${fmt(s.mr)}`);
                    if(s.ap) ln.push(`  APen:${fmt(s.ap)}`); if(s.mpen) ln.push(`  MPen:${fmt(s.mpen)}`);
                }
                txt.push(ln.join("\n"));
            });
        });
        return txt.join("\n");
    };

    const exportAll = () => {
        let cache = activeTab === "BATTLE" ? battleCache : lobbyCache; if (!cache || cache.length === 0) return;
        let exportStr = `=== HW LITE EXPORT ===\n\n`;
        cache.forEach(b => { exportStr += generateTextForTeam(b.rawDef, b.labelDef, b.oppForDef) + "\n\n"; if (b.rawAtt) exportStr += generateTextForTeam(b.rawAtt, b.labelAtt, b.oppForAtt) + "\n\n"; });
        navigator.clipboard.writeText(exportStr).then(()=>alert(t("copied")));
    };

    const renderData = (data, label, col, opp) => {
        let waves = parseTeam(data); if (!waves.length) return;
        waves.forEach((w, i) => {
            let wavePower = 0; w.forEach(h => wavePower += (h.power || 0));

            let hC = document.createElement("div");
            hC.className = "hw-team-label-container";
            hC.style.borderBottomColor = col;

            let labelDiv = document.createElement("div");
            labelDiv.className = "hw-team-label";
            labelDiv.style.borderLeftColor = col;
            labelDiv.style.color = col;
            labelDiv.innerText = (waves.length > 1 ? `${label} [WAVE ${i+1}]` : label) + (wavePower>0?` (${fmt(wavePower)} ${t('power')})`:"");

            let copyBtn = document.createElement("button");
            copyBtn.className = "hw-copy-btn";
            copyBtn.innerText = t('copy');
            copyBtn.onclick = (e) => {
                navigator.clipboard.writeText(generateTextForTeam(w, label, opp));
                e.target.innerText = t("copied"); setTimeout(()=>e.target.innerText=t("copy"), 1000);
            };

            hC.appendChild(labelDiv);
            hC.appendChild(copyBtn);
            content.appendChild(hC);

            w.forEach(h => {
                let row = document.createElement("div"); row.className = "hw-hero-row";
                if (h.isHiddenDummy) {
                    row.innerHTML = `<span class="hw-hero-name hw-hidden-text">??? ${t("hiddenMsg")}</span><span class="hw-hero-power hw-hidden-text">${fmt(h.power)}</span>`;
                    content.appendChild(row); return;
                }

                let metaStr = [];
                if(h.level) metaStr.push(`Lvl ${h.level}`);
                if(h.star) metaStr.push(`⭐${h.star}`);
                let metaHtml = metaStr.length ? `<span class="hw-hero-meta">[${metaStr.join(" ")}]</span>` : "";

                row.innerHTML = `<span><span class="hw-hero-name">${getHeroName(h.id)}</span><span class="hw-hero-id">(${h.id})</span>${metaHtml}</span><span class="hw-hero-power">${fmt(h.power||0)}</span>`;
                content.appendChild(row);

                let det = null;
                row.onclick = () => {
                    if (det) { det.remove(); det = null; return; }
                    det = document.createElement("div"); det.className = "hw-details-box";
                    let sC = document.createElement("div"), sbC = document.createElement("div");
                    det.appendChild(sC); det.appendChild(sbC);

                    let ba=0, bmr=0, bap=0, bmp=0, ca=0, cmr=0;
                    const upd = () => {
                        let s = getHeroStats(h, ba, bmr, bap, bmp);
                        let html = "";
                        if (s.isPreview) {
                            html += `<div class="hw-preview-warn">⚠️ ${t("previewNotice")}</div>`;
                        } else if (s.isTitan) {
                            html += `<div class="wow-stat-row"><span class="wow-stat-label">${t('hp')}:</span><span class="wow-stat-val">${fmt(s.hp)}</span></div>`;
                            html += `<div class="wow-stat-row"><span class="wow-stat-label">${t('pa')}:</span><span class="wow-stat-val">${fmt(s.pa)}</span></div>`;
                        } else {
                            const renderStat = (label, val, isMain = false) => `
                                <div class="wow-stat-row">
                                    <span class="wow-stat-label">${label}:</span>
                                    <span class="wow-stat-val ${isMain ? 'wow-stat-val-main' : ''}">${val}</span>
                                </div>
                            `;

                            html += `<div class="wow-stats-container">`;
                            html += `<div class="wow-stats-col">`;
                            html += `<div class="wow-section-title">- ${t('catBase')}</div>`;
                            html += renderStat(t('int'), fmt(s.int), s.mainStatName === "int");
                            html += renderStat(t('agi'), fmt(s.agi), s.mainStatName === "agi");
                            html += renderStat(t('str'), fmt(s.str), s.mainStatName === "str");

                            html += `<div class="wow-section-title wow-mt-8">- ${t('catOff')}</div>`;
                            html += renderStat(t('pa'), fmt(s.pa));
                            html += renderStat(t('ma'), fmt(s.mp));
                            if(s.ap > 0) html += renderStat(t('ap'), fmt(s.ap));
                            if(s.mpen > 0) html += renderStat(t('mpen'), fmt(s.mpen));
                            if(s.crit > 0) html += renderStat(t('crit'), fmt(s.crit));
                            if(s.mcrit > 0) html += renderStat(t('mcrit'), fmt(s.mcrit));
                            if(s.crush > 0) html += renderStat(t('crush'), fmt(s.crush));
                            html += `</div>`;

                            html += `<div class="wow-stats-col">`;
                            html += `<div class="wow-section-title">- ${t('catDef')}</div>`;
                            html += renderStat(t('hp'), fmt(s.hp));
                            html += renderStat(t('ar'), fmt(s.ar));
                            html += renderStat(t('mr'), fmt(s.mr));
                            if(s.dodge > 0) html += renderStat(t('dodge'), fmt(s.dodge));
                            if(s.toughness > 0) html += renderStat(t('tough'), fmt(s.toughness));
                            if(s.mreflect > 0) html += renderStat(t('refl'), fmt(s.mreflect));
                            html += `</div></div>`;
                        }

                        if (!s.isTitan && !h.isHiddenDummy) {
                            let runes = Array.isArray(h.hero_runes) ? h.hero_runes : Object.values(h.hero_runes||{});
                            html += `<div class="hw-build-box">`;
                            if (runes.length) html += `<div>${t('glyphs')}: <span class="hw-build-val-white">[${runes.join(", ")}]</span></div>`;
                            if (h.artifacts && h.artifacts.length) html += `<div>${t('artifacts')}: <span class="hw-build-val-gold">${h.artifacts.map((a,idx)=>`${["🗡️","📖","💍"][idx] || ""}${a.level}(${a.star}★)`).join(" / ")}</span></div>`;
                            if (h.talisman) html += `<div>${t('talisman')}: <span class="hw-build-val-purple">Lvl ${h.talisman.level} [${(h.talisman.traitIds||[]).join(", ")}]</span></div>`;
                            html += `</div>`;
                        }

                        if (opp.length && !s.isTitan && !s.isPreview) {
                            html += `<details class="hw-matrix-summary"><summary>📊 ${t('matrixSum')}</summary>
                                <table class="hw-matrix-table">
                                    <thead><tr>
                                        <th class="hw-matrix-th hw-col-name">${t('target')}</th>
                                        <th class="hw-matrix-th hw-col-out" title="${t('ttOut')}">▶ OUT</th>
                                        <th class="hw-matrix-th hw-col-in" title="${t('ttIn')}">◀ IN</th>
                                    </tr></thead>
                                    <tbody>`;

                            opp.forEach(o => {
                                if (o.isHiddenDummy) return;
                                let os = getHeroStats(o);

                                let eAr_to = Math.max(0, os.ar - ca - s.ap), eMr_to = Math.max(0, os.mr - cmr - s.mpen);
                                let ext_to = [];
                                if(s.crit > 0 && os.mainStatVal > 0) ext_to.push(`<span class="wow-substat">${t('tblCrit')}: <span class="wow-substat-val">${calcRel(s.crit, os.mainStatVal)}</span></span>`);
                                if(s.mcrit > 0 && os.mainStatVal > 0) ext_to.push(`<span class="wow-substat">${t('tblMgCr')}: <span class="wow-substat-val">${calcRel(s.mcrit, os.mainStatVal)}</span></span>`);
                                if(s.crush > 0 && os.mainStatVal > 0) ext_to.push(`<span class="wow-substat">${t('tblCrush')}: <span class="wow-substat-val">${calcRel(s.crush, os.mainStatVal)}</span></span>`);
                                if(os.dodge > 0 && s.mainStatVal > 0) ext_to.push(`<span class="wow-substat">${t('tblDodge')}: <span class="wow-substat-val">${calcRel(os.dodge, s.mainStatVal)}</span></span>`);
                                if(os.toughness > 0 && s.mainStatVal > 0) ext_to.push(`<span class="wow-substat">${t('tblTough')}: <span class="wow-substat-val">${calcRel(os.toughness, s.mainStatVal)}</span></span>`);
                                if(os.mreflect > 0 && s.mainStatVal > 0) ext_to.push(`<span class="wow-substat">${t('tblRefl')}: <span class="wow-substat-val">${calcRel(os.mreflect, s.mainStatVal)}</span></span>`);

                                let phys_to_str = `${(HW_DIV/(eAr_to+HW_DIV)*100).toFixed(0)}%`;
                                let mag_to_str = `${(HW_DIV/(eMr_to+HW_DIV)*100).toFixed(0)}%`;

                                let mAr_from = Math.max(0, s.ar - os.ap), mMr_from = Math.max(0, s.mr - os.mpen);
                                let ext_from = [];
                                if(os.crit > 0 && s.mainStatVal > 0) ext_from.push(`<span class="wow-substat">${t('tblCrit')}: <span class="wow-substat-val">${calcRel(os.crit, s.mainStatVal)}</span></span>`);
                                if(os.mcrit > 0 && s.mainStatVal > 0) ext_from.push(`<span class="wow-substat">${t('tblMgCr')}: <span class="wow-substat-val">${calcRel(os.mcrit, s.mainStatVal)}</span></span>`);
                                if(s.dodge > 0 && os.mainStatVal > 0) ext_from.push(`<span class="wow-substat">${t('tblDodge')}: <span class="wow-substat-val">${calcRel(s.dodge, os.mainStatVal)}</span></span>`);
                                if(s.toughness > 0 && os.mainStatVal > 0) ext_from.push(`<span class="wow-substat">${t('tblTough')}: <span class="wow-substat-val">${calcRel(s.toughness, os.mainStatVal)}</span></span>`);
                                if(s.mreflect > 0 && os.mainStatVal > 0) ext_from.push(`<span class="wow-substat">${t('tblRefl')}: <span class="wow-substat-val">${calcRel(s.mreflect, os.mainStatVal)}</span></span>`);

                                let phys_from_str = `${(HW_DIV/(mAr_from+HW_DIV)*100).toFixed(0)}%`;
                                let mag_from_str = `${(HW_DIV/(mMr_from+HW_DIV)*100).toFixed(0)}%`;

                                html += `
                                <tr class="hw-matrix-tr">
                                    <td class="hw-matrix-td hw-col-name">${getHeroName(o.id).split(" ")[0]}</td>
                                    <td class="hw-matrix-td hw-col-out">
                                        <div class="wow-dmg-val">
                                            <span class="wow-phys" title="${t('ttPhys')}">${phys_to_str}</span> <span class="wow-dmg-sep">/</span> <span class="wow-mag" title="${t('ttMag')}">${mag_to_str}</span>
                                        </div>
                                        ${ext_to.length ? `<div class="wow-mt-2">${ext_to.join("")}</div>` : ""}
                                    </td>
                                    <td class="hw-matrix-td hw-col-in">
                                        <div class="wow-dmg-val">
                                            <span class="wow-phys" title="${t('ttPhys')}">${phys_from_str}</span> <span class="wow-dmg-sep">/</span> <span class="wow-mag" title="${t('ttMag')}">${mag_from_str}</span>
                                        </div>
                                        ${ext_from.length ? `<div class="wow-mt-2">${ext_from.join("")}</div>` : ""}
                                    </td>
                                </tr>`;
                            });

                            html += `</tbody></table></details>`;
                        }
                        sC.innerHTML = html;
                    };

                    const appendInput = (id, cb) => {
                        const container = sbC.querySelector(`#${id}`);
                        if (container) {
                            const i = document.createElement("input"); i.type = "number"; i.value = 0; i.className = "hw-calc-input";
                            i.oninput = (e) => cb(Number(e.target.value) || 0);
                            container.appendChild(i);
                        }
                    };

                    if (!getHeroStats(h).isPreview && !getHeroStats(h).isTitan) {
                        sbC.innerHTML = `
                            <details class="hw-matrix-summary"><summary>🧮 ${t('calcSum')}</summary>
                                <div class="hw-calc-grid">
                                    <div><div class="hw-calc-label">${t('selfAr')}</div><div id="calc-selfAr"></div></div>
                                    <div><div class="hw-calc-label">${t('selfAp')}</div><div id="calc-selfAp"></div></div>
                                    <div><div class="hw-calc-label">${t('enemyAr')}</div><div id="calc-enemyAr"></div></div>
                                    <div><div class="hw-calc-label">${t('selfMr')}</div><div id="calc-selfMr"></div></div>
                                    <div><div class="hw-calc-label">${t('selfMp')}</div><div id="calc-selfMp"></div></div>
                                    <div><div class="hw-calc-label">${t('enemyMr')}</div><div id="calc-enemyMr"></div></div>
                                </div>
                            </details>
                        `;
                        appendInput("calc-selfAr", v=>{ba=v;upd()}); appendInput("calc-selfMr", v=>{bmr=v;upd()});
                        appendInput("calc-selfAp", v=>{bap=v;upd()}); appendInput("calc-selfMp", v=>{bmp=v;upd()});
                        appendInput("calc-enemyAr", v=>{ca=v;upd()}); appendInput("calc-enemyMr", v=>{cmr=v;upd()});
                    }

                    upd(); row.parentNode.insertBefore(det, row.nextSibling);
                };
            });
        });
    };

    const updateView = () => {
        content.innerHTML = "";
        if (isMinimized) return;
        if (activeTab === "BATTLE" && battleCache) {
            battleCache.forEach(b => { renderData(b.rawDef, b.labelDef, b.colDef, b.oppForDef); if (b.rawAtt) renderData(b.rawAtt, b.labelAtt, b.colAtt, b.oppForAtt); });
        } else if (activeTab === "LOBBY" && lobbyCache) {
            lobbyCache.forEach(b => renderData(b.rawDef, b.labelDef, b.colDef, b.oppForDef));
        } else {
            content.innerText = t("wait");
        }
        drawHeader();
    };

    const extractBlocks = (data) => {
        let bTasks = []; let lTasks = [];

        let responses = [];
        if (data.results) {
            data.results.forEach(r => { if (r.result && r.result.response) responses.push(r.result.response); });
        } else if (data.response) {
            responses.push(data.response);
        } else if (data.result && data.result.response) {
            responses.push(data.result.response);
        } else {
            responses.push(data);
        }

        for (let resp of responses) {
            if (!resp || typeof resp !== "object") continue;
            if (resp.draft || resp.draftEnemy) continue;

            let battles = getAllBattles(resp);
            let validBattles = battles.filter(b => parseTeam(b.attackers).some(w => w.some(h => h.strength !== undefined || h.physicalAttack !== undefined)) || parseTeam(b.defenders).some(w => w.some(h => h.strength !== undefined || h.physicalAttack !== undefined)));

            if (validBattles.length > 0) {
                validBattles.forEach((b, idx) => {
                    let att = parseTeam(b.attackers)[0] || [], def = parseTeam(b.defenders)[0] || [];
                    let sfx = validBattles.length > 1 ? ` (${t("team")} ${idx + 1})` : "";
                    bTasks.push({ rawDef: b.defenders, rawAtt: b.attackers, oppForDef: att, oppForAtt: def, labelDef: `${t("defenders")}${sfx}`, labelAtt: `${t("attackers")}${sfx}`, colDef: "#ff4d4d", colAtt: "#4da6ff" });
                });
            }

            let eList = null;
            if (resp.enemies) {
                if (Array.isArray(resp.enemies)) eList = resp.enemies;
                else if (typeof resp.enemies === "object") {
                    if (resp.enemies.enemies) {
                        eList = Array.isArray(resp.enemies.enemies) ? resp.enemies.enemies : Object.values(resp.enemies.enemies);
                    } else {
                        eList = Object.values(resp.enemies);
                    }
                }
            } else if (resp.type === "RatingArena" && resp.enemies) {
                eList = resp.enemies;
            }

            if (!eList && resp.type === "RatingArena" && resp.enemies) eList = resp.enemies;

            if (eList) {
                eList.forEach((e, i) => {
                    let name = isHideNames ? t("hidden") : (e.user?.name || "Player"), userCol = getColor(i);
                    let heroWaves = [];
                    if (Array.isArray(e.heroes)) {
                        if (Array.isArray(e.heroes[0])) heroWaves = e.heroes;
                        else heroWaves = [e.heroes];
                    } else if (e.heroes && typeof e.heroes === "object") {
                        heroWaves = Object.keys(e.heroes).sort().map(k => e.heroes[k]);
                    }

                    if (heroWaves.length > 1) {
                        let visiblePower = 0;
                        heroWaves.forEach((team, tIdx) => {
                            let tArr = Array.isArray(team) ? team : Object.values(team);
                            lTasks.push({ rawDef: tArr, rawAtt: null, oppForDef: [], oppForAtt: [], labelDef: `${t("enemy")}: ${name} [${t("team")} ${tIdx+1}]`, colDef: userCol });
                            tArr.forEach(h => { if (h && h.power) visiblePower += h.power; });
                        });
                        let totalPower = parseInt(e.power || 0, 10);
                        if (totalPower > visiblePower && heroWaves.length < 3) {
                            lTasks.push({ rawDef: [{id: 99999, power: totalPower - visiblePower, isHiddenDummy: true}], rawAtt: null, oppForDef: [], oppForAtt: [], labelDef: `⚠️ ${t("enemy")}: ${name} [${t("team")} 3] [${t("hiddenMsg")}]`, colDef: "#888" });
                        }
                    } else if (heroWaves.length === 1) {
                        let tArr = Array.isArray(heroWaves[0]) ? heroWaves[0] : Object.values(heroWaves[0]);
                        lTasks.push({ rawDef: tArr, rawAtt: null, oppForDef: [], oppForAtt: [], labelDef: `${t("enemy")}: ${name}`, colDef: userCol });
                    }
                });
            }

            if (resp.challenges && Array.isArray(resp.challenges)) {
                resp.challenges.slice(0, 3).forEach(ch => { if (ch.data && ch.data.defenders) lTasks.push({ rawDef: ch.data.defenders, rawAtt: null, oppForDef: [], oppForAtt: [], labelDef: `${t("training")}: [${ch.data.type === "titan" ? "TITANS" : "HEROES"}]`, colDef: "#ffd100" }); });
            }

            let wi = resp.warInfo || resp;
            if (wi && (wi.enemySlots || wi.ourSlots)) {
                ["enemySlots", "ourSlots"].forEach((k) => {
                    if (!wi[k]) return;
                    Object.keys(wi[k]).forEach(id => {
                        if (wi[k][id] && wi[k][id].team) lTasks.push({ rawDef: wi[k][id].team, rawAtt: null, oppForDef: [], oppForAtt: [], labelDef: `${k === "enemySlots" ? t("enemy") : t("ally")} [${isHideNames ? t("hidden") : id}]`, colDef: k === "enemySlots" ? "#ff4d4d" : "#4da6ff" });
                    });
                });
            }
        }
        return { bTasks, lTasks };
    };

    function handleResp(data) {
        let { bTasks, lTasks } = extractBlocks(data);
        if (bTasks.length === 0 && lTasks.length === 0) return;
        lastGameResponse = data; let needsRender = false;
        let curBHash = bTasks.length > 0 ? JSON.stringify(bTasks) : "", curLHash = lTasks.length > 0 ? JSON.stringify(lTasks) : "";
        if (bTasks.length > 0 && curBHash !== lastBHash) { battleCache = bTasks; lastBHash = curBHash; activeTab = "BATTLE"; needsRender = true; }
        if (lTasks.length > 0 && curLHash !== lastLHash) { lobbyCache = lTasks; lastLHash = curLHash; if (activeTab === "WAIT" || activeTab === "LOBBY") { activeTab = "LOBBY"; needsRender = true; } }
        if (needsRender && !isMinimized) updateView(); else drawHeader();
    }

    const rO = XMLHttpRequest.prototype.open, rS = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m, u, ...a) { this._url = u; return rO.apply(this, [m, u, ...a]); };
    XMLHttpRequest.prototype.send = function(b, ...a) {
        if (this._url && (this._url.includes("rpc") || this._url.includes("api") || this._url.includes("hero-wars"))) {
            this.addEventListener("readystatechange", function() { if (this.readyState === 4) { try { let d = JSON.parse(this.responseText); if(d) handleResp(d); } catch(e){} } });
        }
        return rS.apply(this, [b, ...a]);
    };

    const oF = window.fetch;
    window.fetch = async function(...args) {
        const reqUrl = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
        const r = await oF.apply(this, args);
        if (reqUrl.includes("rpc") || reqUrl.includes("api") || reqUrl.includes("hero-wars")) { try { const c = r.clone(); const d = await c.json(); if(d) handleResp(d); } catch(e){} }
        return r;
    };
})();
