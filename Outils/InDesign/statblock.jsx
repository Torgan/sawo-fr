var mySel = app.selection[0];  // Now pointing to the text cursor  
var myStory = mySel.parentStory;

var myIp      = myStory.insertionPoints.item(mySel.index);  
var statBlock = mySel.contents;

var secondary = [];
var actions = [];
var specialAbilities = [];

/** Attributs */

var reFr = RegExp('Agilité (.*?), Intellect (.*?), Âme (.*?), Force (.*?), Vigueur (.+?)[ \r\n]');
var reEn = RegExp('Agility (.*?), Smarts (.*?), Spirit (.*?), Strength (.*?), Vigor (.+?)[ \r\n]');

var reAgility  = RegExp('(Agilit[éy])[^d]+(d.*?)[\s,\r\n]', 'm');
var reSmarts   = RegExp('(Intellect|Smarts)[^d]+(d.*?)[\s,\r\n]', 'm');
var reSpirit   = RegExp('([ÂA]me|Spirit)[^d]+(d.*?)[\s,\r\n]', 'm');
var reStrength = RegExp('(Force|Strength)[^d]+(d.*?)[\s,\r\n]', 'm');
var reVigor    = RegExp('(Vigor|Vigueur)[^d]+(d.*?)[\s,\r\n]', 'm');

if (
    (mAgility  = statBlock.match(reAgility)) &&
    (mSmarts   = statBlock.match(reSmarts)) &&
    (mSpirit   = statBlock.match(reSpirit)) &&
    (mStrength = statBlock.match(reStrength)) &&
    (mvigor    = statBlock.match(reVigor))
){
    var attributes1 = '\tAGI\tÂME\tFOR\tINT\tVIG';
    var attributes2 = '\t' +
        mAgility[2] + '\t' +
        mSpirit[2] + '\t' +
        mStrength[2] + '\t' +
        mSmarts[2] + '\t' +
        mvigor[2];
} else {
    throw Error('No attributes found');
}

/** Compétences */

var reFr = RegExp('^Compétences?\\s*:\\s*(.*?)\\.?$', 'm');

if (matches = statBlock.match(reFr)) {
    var skills = matches[1];
}

var reFr = RegExp('^Atouts?\\s*: (.*?)$', 'm');

if (matches = statBlock.match(reFr)) {
    var edges = matches[1];
}

var reFr = RegExp('^Handicaps?\\s*: (.*?)$', 'm');

if (matches = statBlock.match(reFr)) {
    var hinderances = matches[1];
}

/** Secondary */

var reFr = RegExp(
    '(Cha(risme)?\\s*:\\s*(.+?)\\s*;\\s*)?' +
    'Allure\\s*?:\\s*(.+?)\\s*;\\s*' + 
    'Parade\\s*?:\\s*(.+?)\\s*;\\s*' +
    'Résistance\\s*:\\s*(.+?)\\s*[\\r\\n]', 
    'm'
);

if (matches = statBlock.match(reFr)) {
    secondary.push([ 'Allure : ' + matches[4] + '\r', 'Corps']);

    if (matches[1]) {
        secondary.push([ 'Charisme : ' + matches[3] + '\r', 'Corps']);
    }

    var combat1 = "\tParade\tRésistance\r";
    var combat2 = "\t" + matches[5] + "\t" + matches[6] + "\r";
}

/** Equipement */

var reFr = RegExp('^[EÉeé]quipement\\s*: (.*?)$', 'm');

if (matches = statBlock.match(reFr)) {
    var equipment = matches[1];
    
    var reSplit = RegExp(',\s*', 'g');
    var item = equipment.split(reSplit);

    for (var i=0; i < item.length; i++) {
        var reAction = RegExp('^(.+) +\\((.*?)\\)$', '');
        if (m = item[i].match(reAction)) {
            var weapon = m[1].charAt(0).toUpperCase() + m[1].substr(1);
            actions.push([weapon + " : " + m[2] + "\r", 'Texte section — Combat']);
            equipment = equipment.replace(m[0], m[1]);
        }
    }

}

/** Pouvoirs */

var reFr = RegExp('^Pouvoirs\s*: (.*?)$', 'm');

if (matches = statBlock.match(reFr)) {
    var reSplit = RegExp(',\s*', 'g');
    var powers = matches[1].split(reSplit);

    for (var i=0; i < powers.length; i++) {
        while (' ' == powers[i].charAt(0)) {
            powers[i] = powers[i].substr(1);
        }
        actions.push([powers[i] + " : \r", 'Texte section — Magie']);
    }
}

/** Capacités spéciales */

var reFr = RegExp('^Capacités spéciales\\s*:\\s*(.*)', 'mi');

if (matches = statBlock.match(reFr)) {
    var reSplit = RegExp('\\s*[\\n\\r]\\s*', 'g');
    var abilities = matches[1].split(reSplit);

    for (var i=0; i < abilities.length; i++) {
        while (' ' == abilities[i].charAt(0)) {
            abilities[i] = abilities[i].substr(1);
        }
    
        var reSub = RegExp('^(.+?)\\s*:\\s*(.*)');
        
        if (m = abilities[i].match (reSub)) {
            if (('Morsure' == m[1]) || ('Griffes' == m[1])) {
                actions.push([m[1] + " : " + m[2] + "\r", 'Texte section — Combat']);
            } else if (('Aquatique' == m[1]) || ('Vol' == m[1])) {
                secondary.push([m[1] + " : " + m[2] + "\r", 'Corps']);
            } else {
                specialAbilities.push([abilities[i] + "\r", 'Texte section — Divers']);
            }
        } else {
            specialAbilities.push([abilities[i] + "\r", 'Texte section — Divers']);
        }
    }
}

/** Création du statblock */

var  
    mSourceIdx = app.selection[0].index,  
    mStory = app.selection[0].parentStory,  
    mReplaceStuff = {  
        elements: secondary
    },  
    mTarget, cElement, cText, cParaStyle;  

mReplaceStuff.elements.push([attributes1 + "\r",  'Attributs - Première ligne']);
mReplaceStuff.elements.push([attributes2 + "\r",  'Attributs']);
mReplaceStuff.elements.push(["Compétences : " + skills + "\r",  'Corps - Première ligne']);

if (hinderances) {
    mReplaceStuff.elements.push([ "Handicaps : " + hinderances + "\r", 'Corps' ]);
}

if (edges) {
    mReplaceStuff.elements.push([ "Atouts : " + edges + "\r", 'Corps' ]);
}

mReplaceStuff.elements.push([combat1, 'Parade - Résistance - 1' ]);
mReplaceStuff.elements.push([combat2, 'Parade - Résistance - 2' ]);

mReplaceStuff.elements.push(["Capacités spéciales\r", 'Section']);
mReplaceStuff.elements = mReplaceStuff.elements.concat(specialAbilities);
mReplaceStuff.elements.push(["Actions\r", 'Section']);
mReplaceStuff.elements = mReplaceStuff.elements.concat(actions);
mReplaceStuff.elements.push(["Réactions\r", 'Section']);

if (equipment) {
    mReplaceStuff.elements.push(["Équipement : " + equipment + "\r", 'Corps - Première ligne']);
}

var pStyleGroup = app.activeDocument.paragraphStyleGroups.itemByName('Statblock');

while (cElement = mReplaceStuff.elements.pop()) {  
    cText = cElement[0];  
    cParaStyle = pStyleGroup.paragraphStyles.itemByName(cElement[1]);
    mTarget = mStory.insertionPoints.item(mSourceIdx);  
    mTarget.contents = cText + '';  
    mTarget.paragraphs[0].appliedParagraphStyle = cParaStyle;  
}
