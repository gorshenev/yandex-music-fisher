const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const manifest = require('../src/manifest.json');
const pack = require('../package.json');

const isOpera = process.argv[2] === '--opera';
const isFirefox = process.argv[2] === '--firefox';
const isChromium = !isFirefox && !isOpera;

const platform = (isFirefox) ? 'firefox' : (isOpera) ? 'opera' : 'chromium';
const distFolder = path.join(path.dirname(__dirname), 'dist', platform);

function readDirSync(dir, filelist) {
    const files = fs.readdirSync(dir);

    filelist = filelist || [];
    files.forEach((file) => {
        const relativePath = dir + file;

        if (fs.statSync(relativePath).isDirectory()) {
            filelist = readDirSync(`${relativePath}/`, filelist);
        } else {
            filelist.push({
                path: relativePath,
                data: fs.readFileSync(relativePath)
            });
        }
    });
    return filelist;
}

function createManifest() {
    manifest.version = pack.version;
    if (isFirefox) {
        manifest.applications = {
            gecko: {
                id: 'yandex-music-fisher@egoroof.ru',
                strict_min_version: '51.0'
            }
        };
    }
    if (isChromium) {
        manifest.optional_permissions = ['background'];
        manifest.permissions.push('downloads.shelf');
        manifest.minimum_chrome_version = '51.0';
    }
    if (isOpera) {
        manifest.minimum_opera_version = '38.0';
    }
    if (isChromium || isOpera) {
        manifest.incognito = 'split';
    }

    fs.writeFileSync(path.join(distFolder, 'manifest.json'), JSON.stringify(manifest));
    console.log(`manifest.json was written in ${distFolder}`);
}

function createArchive() {
    const list = readDirSync(`${distFolder}/`);
    const zip = new JSZip();

    list.forEach((file) => {
        zip.file(file.path.replace(`${distFolder}/`, ''), file.data);
    });

    zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    }).then((buffer) => {
        const archiveName = `yandex-music-fisher_${pack.version}_${platform}.zip`;

        fs.writeFileSync(path.join('dist', archiveName), buffer);
        console.log(`${archiveName} was created`);
    }).catch((e) => {
        console.error(e);
        process.exit(1);
    });
}

createManifest();
createArchive();
