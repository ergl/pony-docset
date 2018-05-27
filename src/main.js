const utils = require('./utils');
const parsePackage = require('./parsePackage');

const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function docsetStructure(docsetName) {
    return `${docsetName}.docset/Contents/Resources/Documents`;
}

function plistPath(docsetName) {
    return `${docsetName}.docset/Contents/Info.plist`;
}

function setupDB(docsetName) {
    const dbPath = path.resolve(
        `${docsetName}.docset/Contents/Resources/docSet.dsidx`
    );

    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    const db = new sqlite3(dbPath);
    db.exec(
        'CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT)'
    );

    db.exec('CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path)');

    return db;
}

function prepareDocset(docsetName) {
    utils.mkdirSync(docsetStructure(docsetName));
    utils.writePlist(docsetName, plistPath(docsetName));
    return setupDB(docsetName);
}

function main(argc, argv) {
    if (argc !== 3) {
        console.error(`${argv[0]} <docset-name> <path>`);
        process.exit(1);
    }

    const docsetName = argv[1];
    const givenPath = path.resolve(argv[2]);

    const db = prepareDocset(docsetName);
    const stmt = db.prepare(
        'INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES (@name, @type, @path)'
    );

    const packageDirs = utils.packageDirs(givenPath);
    const allLength = packageDirs.length;
    let i = 1;
    let directoryDetails;
    for (package of packageDirs) {
        directoryDetails = parsePackage.parse(givenPath, package);
        for (typeDetails of directoryDetails) {
            utils.printInline(`${i} / ${allLength} [${typeDetails.name}]`);
            stmt.run(typeDetails);
        }
        i++;
    }

    process.stdout.write('\nCopying doc files...\n');

    utils.copyFolderSync(givenPath, path.resolve(docsetStructure(docsetName)));
    db.close();
}

const real_argv = process.argv.slice(1);
main(real_argv.length, real_argv);
