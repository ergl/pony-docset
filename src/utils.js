const fs = require('fs');
const path = require('path');

function writePlist(bundleName, givenPath) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${bundleName}</string>
    <key>CFBundleName</key>
    <string>${bundleName}</string>
    <key>DocSetPlatformFamily</key>
    <string>${bundleName}</string>
    <key>isDashDocset</key>
    <true/>
    <key>dashIndexFilePath</key>
    <string>index.html</string>
</dict>
</plist>
`;
    fs.writeFileSync(path.resolve(givenPath), xml);
}

function mkdirSync(givenPath) {
    mkdirSynInternal(givenPath, null);
}

function mkdirSynInternal(givenPath, prev) {
    const realPath = path.resolve(givenPath);

    try {
        fs.mkdirSync(realPath);
        prev = prev || realPath;
    } catch (err) {
        if (err.code === 'ENOENT') {
            prev = mkdirSynInternal(path.dirname(realPath), prev);
            mkdirSynInternal(realPath, prev);
        }
    }

    return undefined;
}

function allSubDirs(givenPath) {
    const realPath = path.resolve(givenPath);

    const isDir = d => {
        return fs.lstatSync(d).isDirectory();
    };

    return fs
        .readdirSync(realPath)
        .map(name => {
            return path.join(realPath, name);
        })
        .filter(isDir);
}

function packageDirs(givenPath) {
    const isPackage = RegExp('.*--index');
    const all_subdirs = allSubDirs(givenPath);
    const discardable = [
        'css',
        'js',
        'search',
        'img',
        'fonts',
        'license',
        'src',
        'packages-stdlib--index'
    ];
    return all_subdirs.filter(folderPath => {
        const package_dir = isPackage.test(folderPath);
        const shouldDiscard = discardable.includes(path.basename(folderPath));
        return package_dir && !shouldDiscard;
    });
}

function copyFolderSync(source, target) {
    const shell = require('child_process').execSync;
    // yes, yes I did
    shell(`cp -r ${source}/* ${target}/`);
}

function printInline(text) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text);
}

module.exports = {
    mkdirSync,
    packageDirs,
    writePlist,
    printInline,
    copyFolderSync
};
