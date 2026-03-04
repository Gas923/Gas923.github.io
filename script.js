// Game Data
const gameData = {
    swords: ["fist", "longsword", "claymore", "royal sword", "sandshard", "inferno sword", "icebringer sword", "dragofeng", "emberheart sword"],
    mobs: ["snail", "pig", "turtle", "caveman", "spider", "mammoth", "viperbloom", "warlock", "spartan", "reaper", "angel", "cowboy", "ghost", "totem sentinel", "mummy", "blightleap", "bonepicker", "oculon", "magmaton", "knobble", "puffcap", "winxy", "shellthorn"],
    staffs: ["winterbolt staff", "flame staff", "lightning staff", "aqua staff", "inferno staff", "nature staff", "elixir staff"],
    multiplicatives: ["", "k", "m", "b", "t", "qd"],
    mobHealths: [
        10, 800, 2500, 4500, 12500, 75000, 125000, 100000, 
        250000, 750000, 1500000, 15000000, 60000000, 
        250000000, 500000000, 2500000000, 25000000000, 
        100000000000, 600000000000, 1800000000000, 
        11000000000000, 66000000000000, 400000000000000
    ],
    mobPhysicalResistances: [0, 0, 10, 0, 0, 20, 0, 0, 20, 10, 10, 10, 20, 20, 30, 10, 30, 10, 10, 10, 30, 0, 70],
    mobMagicResistances: [0, 0, 0, 0, 10, 10, 0, 20, 0, 20, 25, 0, 60, 20, 10, 30, 30, 70, 20, 25, 30, 70, 10],
    strMultiplicatives: [1, 1000, 1000000, 1000000000, 1000000000000, 1000000000000000],
    staffMultiplicatives: [0.15, 0.17, 0.2, 0.23, 0.3, 0.35, 2.5],
    swordMultiplicatives: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 1.2, 0.7],
    expDrops: [10, 40, 100, 250, 400, 1000, 1750, 3250, 5500, 14000, 30000, 50000, 110000, 250000, 500000, 750000, 1500000, 3250000, 7000000, 12000000, 24000000, 50000000, 100000000]
};

// DOM Elements
const mobSelect = document.getElementById('mob');
const strengthInput = document.getElementById('strength');
const multiplierSelect = document.getElementById('multiplier');
const weaponSelect = document.getElementById('weapon');
const potionsInput = document.getElementById('potions');
const doubleSPCheckbox = document.getElementById('doubleSP');
const isStaffCheckbox = document.getElementById('isStaff');
const calculateBtn = document.getElementById('calculateBtn');
const resultsDiv = document.getElementById('results');
const resultText = document.getElementById('resultText');
const killCountSpan = document.getElementById('killCount');
const timeNeededSpan = document.getElementById('timeNeeded');

// Auto-detect staff based on weapon selection
weaponSelect.addEventListener('change', function() {
    const weapon = this.value;
    const isStaff = gameData.staffs.includes(weapon);
    isStaffCheckbox.checked = isStaff;
});

// Calculate button click
calculateBtn.addEventListener('click', function() {
    const mob = mobSelect.value;
    const strInitial = parseFloat(strengthInput.value) || 0;
    const strBonus = multiplierSelect.value;
    const weapon = weaponSelect.value;
    const potions = parseInt(potionsInput.value) || 0;
    const doubleSP = doubleSPCheckbox.checked;
    const isStaff = isStaffCheckbox.checked;

    if (strInitial <= 0) {
        alert('Please enter your current strength/magic points!');
        return;
    }

    const results = calculateSP(mob, strInitial, strBonus, weapon, potions, doubleSP, isStaff);

    const mobIndex = gameData.mobs.indexOf(mob);
    const nextMob = mobIndex + 1 < gameData.mobs.length ? gameData.mobs[mobIndex + 1] : "the final boss";

    if (!results.canOneShotCurrent) {
        resultText.textContent = `You can't one-shot this mob. Try farming another one first until you have ${formatNumber(results.spNeededForCurrent)} more skill points.`;
        killCountSpan.textContent = 'N/A';
        timeNeededSpan.textContent = 'N/A';
    } else {
        const spNeededText = formatNumber(results.spNeededForNext);
        resultText.textContent = `To one-shot ${capitalize(nextMob)} (requires ${spNeededText} SP), you must kill ${formatNumber(results.killCount)} ${capitalize(mob)}s which will take roughly ${formatTime(results.minutes)}.`;
        killCountSpan.textContent = formatNumber(results.killCount);
        timeNeededSpan.textContent = formatNumber(results.minutes);
    }
    
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function calculateSP(mob, strInitial, strBonus, weapon, potions, doubleSP, isStaff) {
    let strFinal = 0;
    let weaponMulti = 0;
    let expDrop = 0;
    let nextMobHealth = 0;
    let KPM = 0;
    let minutes = 0;
    let killCount = 0;
    let potionMinutesLeft = potions * 30;

    const multIndex = gameData.multiplicatives.indexOf(strBonus);
    if (multIndex !== -1) {
        strFinal = strInitial * gameData.strMultiplicatives[multIndex];
    } else {
        strFinal = strInitial;
    }

    if (isStaff) {
        KPM = 52;
        const staffIndex = gameData.staffs.indexOf(weapon);
        if (staffIndex !== -1) {
            weaponMulti = gameData.staffMultiplicatives[staffIndex];
        }
    } else {
        KPM = 42;
        const swordIndex = gameData.swords.indexOf(weapon);
        if (swordIndex !== -1) {
            weaponMulti = gameData.swordMultiplicatives[swordIndex];
        }
    }

    const mobIndex = gameData.mobs.indexOf(mob);
    if (mobIndex === -1) {
        return { canOneShotCurrent: false, spNeededForCurrent: 0 };
    }

    const physicalResist = gameData.mobPhysicalResistances[mobIndex] / 100;
    const magicResist = gameData.mobMagicResistances[mobIndex] / 100;
    const resistance = isStaff ? magicResist : physicalResist;

    const currentMobHealth = gameData.mobHealths[mobIndex];
    const currentDamage = strFinal * weaponMulti * (1 - resistance);
    
    if (currentDamage < currentMobHealth) {
        const effectiveWeaponMulti = weaponMulti * (1 - resistance);
        const spNeeded = Math.ceil((currentMobHealth / effectiveWeaponMulti) - strFinal);
        return { 
            canOneShotCurrent: false,
            spNeededForCurrent: spNeeded
        };
    }

    if (mobIndex + 1 >= gameData.mobs.length) {
        return { 
            canOneShotCurrent: true,
            minutes: 0,
            killCount: 0,
            spNeededForNext: 0
        };
    }

    nextMobHealth = gameData.mobHealths[mobIndex + 1];
    expDrop = doubleSP ? gameData.expDrops[mobIndex] * 2 : gameData.expDrops[mobIndex];
    
    const nextPhysicalResist = gameData.mobPhysicalResistances[mobIndex + 1] / 100;
    const nextMagicResist = gameData.mobMagicResistances[mobIndex + 1] / 100;
    const nextResistance = isStaff ? nextMagicResist : nextPhysicalResist;
    
    const effectiveWeaponMultiNext = weaponMulti * (1 - nextResistance);
    const targetStr = nextMobHealth / effectiveWeaponMultiNext;
    const spNeededForNext = Math.ceil(targetStr);

    const baseExpPerMinute = expDrop * KPM;

    if (baseExpPerMinute <= 0 || weaponMulti <= 0) {
        return { 
            canOneShotCurrent: true,
            minutes: 0, 
            killCount: 0,
            spNeededForNext: spNeededForNext
        };
    }

    const strNeeded = targetStr - strFinal;

    if (strNeeded <= 0) {
        return { 
            canOneShotCurrent: true,
            minutes: 0, 
            killCount: 0,
            spNeededForNext: spNeededForNext
        };
    }

    const potionExp = Math.min(potionMinutesLeft * baseExpPerMinute * 2, strNeeded);
    const potionMinutesUsed = Math.ceil(potionExp / (baseExpPerMinute * 2));
    const remaining = strNeeded - potionExp;

    const normalMinutes = remaining > 0 ? Math.ceil(remaining / baseExpPerMinute) : 0;

    minutes = potionMinutesUsed + normalMinutes;
    killCount = minutes * KPM;

    return { 
        canOneShotCurrent: true,
        minutes, 
        killCount,
        spNeededForNext: spNeededForNext
    };
}

// Helper functions
function capitalize(str) {
    return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatNumber(num) {
    if (num >= 1e15) {
        return (num / 1e15).toFixed(2) + 'Qd';
    } else if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toLocaleString();
}

function formatTime(minutes) {
    if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        return `${days} day${days > 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`;
    } else if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min`;
    }
    return `${minutes} minutes`;
}

// ==================== BOSS ONE-SHOT CALCULATOR ====================

const bossData = [
    { name: "Chief", hp: 25000, physRes: 0, magRes: 0 },
    { name: "Dino", hp: 250000, physRes: 0, magRes: 20 },
    { name: "Arachinex", hp: 450000, physRes: 20, magRes: 20 },
    { name: "Grimroot", hp: 950000, physRes: 20, magRes: 100 },
    { name: "Leonidas", hp: 1250000, physRes: 25, magRes: 25 },
    { name: "Lightning God", hp: 25000000, physRes: 30, magRes: 30 },
    { name: "Sand Golem", hp: 2000000000, physRes: 40, magRes: 0 },
    { name: "Hydra Worm", hp: 4000000000, physRes: 20, magRes: 90 },
    { name: "Dragon", hp: 8000000000, physRes: 40, magRes: 40 },
    { name: "Minotaur", hp: 30000000000, physRes: 50, magRes: 50 },
    { name: "Nevermore", hp: 75000000000, physRes: 30, magRes: 60 },
    { name: "Simba", hp: 750000000000, physRes: 70, magRes: 30 },
    { name: "Anubis", hp: 1500000000000, physRes: 50, magRes: 70 },
    { name: "Eyegor", hp: 110000000000000, physRes: 40, magRes: 60 },
    { name: "Bloodroot Witch", hp: 4000000000000000, physRes: 30, magRes: 40 },
    { name: "Queen of Serpents", hp: 12000000000000000, physRes: 40, magRes: 50 },
    { name: "Ashgor", hp: 1600000000000, physRes: 50, magRes: 50 },
];

// DOM Elements - Boss Panel
const bossSelect = document.getElementById('boss');
const bossWeaponSelect = document.getElementById('bossWeapon');
const bossIsStaffCheckbox = document.getElementById('bossIsStaff');
const bossCalcBtn = document.getElementById('bossCalcBtn');
const bossResultsDiv = document.getElementById('bossResults');

// Auto-detect staff for boss weapon
bossWeaponSelect.addEventListener('change', function () {
    const weapon = this.value;
    bossIsStaffCheckbox.checked = gameData.staffs.includes(weapon);
});

// Boss calculate
bossCalcBtn.addEventListener('click', function () {
    const bossIndex = parseInt(bossSelect.value);
    const boss = bossData[bossIndex];
    if (!boss) return;

    const weapon = bossWeaponSelect.value;
    const isStaff = bossIsStaffCheckbox.checked;

    let weaponMulti = 0;
    if (isStaff) {
        const staffIndex = gameData.staffs.indexOf(weapon);
        if (staffIndex !== -1) weaponMulti = gameData.staffMultiplicatives[staffIndex];
    } else {
        const swordIndex = gameData.swords.indexOf(weapon);
        if (swordIndex !== -1) weaponMulti = gameData.swordMultiplicatives[swordIndex];
    }

    const resistance = isStaff ? (boss.magRes / 100) : (boss.physRes / 100);
    const effectiveMulti = weaponMulti * (1 - resistance);

    const spNeeded = effectiveMulti > 0 ? Math.ceil(boss.hp / effectiveMulti) : Infinity;

    bossResultsDiv.classList.remove('hidden');

    document.getElementById('bossDisplayName').textContent = boss.name;
    document.getElementById('bossHpText').textContent = formatNumber(boss.hp) + ' HP';
    document.getElementById('bossHpFill').style.width = '100%';

    document.getElementById('spNeeded').textContent = spNeeded === Infinity ? '∞' : formatNumber(spNeeded);
    document.getElementById('bossWeaponMulti').textContent = weaponMulti.toFixed(2) + 'x';

    document.getElementById('bossPhysRes').textContent = boss.physRes + '%';
    document.getElementById('bossMagRes').textContent = boss.magRes + '%';
    document.getElementById('bossEffMulti').textContent = effectiveMulti > 0 ? effectiveMulti.toFixed(4) + 'x' : '0x';

    const tipEl = document.getElementById('bossTip');
    if (resistance >= 1) {
        tipEl.textContent = `⚠️ This boss has 100% resistance to your damage type. Try switching to a ${isStaff ? 'sword' : 'staff'}!`;
    } else if (effectiveMulti <= 0) {
        tipEl.textContent = `⚠️ Cannot calculate - check your weapon selection.`;
    } else {
        tipEl.textContent = `💡 You need ${formatNumber(spNeeded)} ${isStaff ? 'magic' : 'strength'} points with ${capitalize(weapon)} to one-shot ${boss.name}.`;
    }

    bossResultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
