const jsdom = require('jsdom');
const fs = require('fs');
const node_path = require('path');

function to_dash_type(type) {
    if (type === 'Actor') {
        return 'Class';
    }

    if (type === 'Primitive') {
        return 'Module';
    }

    return type;
}

function relPath(root, url) {
    return node_path.relative(root, url);
}

function capitalize(word) {
    const [first, ...rest] = word.split('');
    return [first.toUpperCase()].concat(rest).join('');
}

function clean_name(title, cleanName) {
    return `${title.split('[', 1).join('')}.${cleanName}`;
}

function clean_function_name(name) {
    return `${name.innerHTML
        .split('<')[0]
        .split('[', 1)
        .join('')}`;
}

function get_names(type, title, elt) {
    const all_siblings = [];
    const example_regex = RegExp('example.*');
    const valid_sibling = e => {
        if (e.tagName !== 'H2') {
            return true;
        } else {
            const e_id = elt.getAttribute('id');
            return example_regex.test(e_id);
        }
    };

    while (elt !== null && valid_sibling(elt)) {
        if (elt.tagName === 'H3') {
            const id = elt.getAttribute('id');
            const name = clean_function_name(elt);
            if (!name.startsWith('_')) {
                all_siblings.push({
                    id,
                    type,
                    name: clean_name(title, name)
                });
            }
        }
        elt = elt.nextElementSibling;
    }

    return all_siblings;
}

function public_constructors(title, document) {
    const cons = document.getElementById('constructors');
    if (cons === null) {
        return [];
    }

    return get_names('Constructor', title, cons.nextElementSibling);
}

function public_behaviours(type, title, document) {
    if (type !== 'Actor') {
        return [];
    }

    const be = document.getElementById('public-behaviours');
    if (be === null) {
        return [];
    }

    return get_names('Method', title, be.nextElementSibling);
}

function public_functions(type, title, document) {
    const cons = document.getElementById('public-functions');
    if (cons === null) {
        return [];
    }

    const dash_type = type === 'Primitive' ? 'Function' : 'Method';
    return get_names(dash_type, title, cons.nextElementSibling);
}

function parse_field(field) {
    return field.split(' ', 2)[1].split(':', 1)[0];
}

function get_field_name(title, field) {
    return `${title.split('[', 1).join('')}.${field}`;
}

function gather_fields(title, elt) {
    const all_siblings = [];
    while (elt !== null && elt.tagName !== 'H2') {
        if (elt.tagName === 'UL') {
            const field_name = parse_field(elt.children[0].textContent);
            all_siblings.push({
                id: 'public-fields',
                type: 'Field',
                name: get_field_name(title, field_name)
            });
        }

        elt = elt.nextElementSibling;
    }

    return all_siblings;
}

function public_fields(title, document) {
    const cons = document.getElementById('public-fields');
    if (cons !== null) {
        return gather_fields(title, cons.nextElementSibling);
    }

    return [];
}

function parseSubType(rootPath, { name, type, path }) {
    let url = pathToUrl(path);
    const url_fd = fs.readFileSync(url);
    const document = new jsdom.JSDOM(url_fd).window.document;

    const topDetails = [
        {
            name,
            type: to_dash_type(type),
            path: relPath(rootPath, url)
        }
    ];

    const constructors = public_constructors(name, document);
    const fields = public_fields(name, document);
    const behaviours = public_behaviours(type, name, document);
    const functions = public_functions(type, name, document);

    const all_info = constructors
        .concat(fields)
        .concat(behaviours)
        .concat(functions)
        .map(elt => {
            const { type: pony_type, name, id } = elt;
            const rel_url = relPath(rootPath, url);
            const real_url = `${rel_url}#${id}`;
            return { name, type: to_dash_type(pony_type), path: real_url };
        });

    return topDetails.concat(all_info);
}

function getPublicTypes(dirPath, url) {
    const url_fd = fs.readFileSync(url);
    const document = new jsdom.JSDOM(url_fd).window.document;

    const publicTypes = [];
    const documentTypes = Array.from(
        document.querySelector('h2#public-types + ul').children
    );

    for (documentType of documentTypes) {
        const element = documentType.children[0];
        const typePath = element.getAttribute('href');
        const elementHTML = element.innerHTML;

        const [ponyType, ponyName] = elementHTML.split(' ');
        publicTypes.push({
            name: ponyName,
            type: capitalize(ponyType),
            path: node_path.resolve(dirPath, typePath)
        });
    }

    return publicTypes;
}

function getPackageName(path) {
    const path_parts = path.split(node_path.sep);
    var packageName = path_parts[path_parts.length - 1];
    packageName = packageName.split('--')[0];
    packageName = packageName.replace('-', '/');
    return packageName;
}

function pathToUrl(path) {
    let url = path;
    if (!url.endsWith('.html')) {
        if (url.endsWith('/')) {
            url = url + 'index.html';
        } else {
            url = url + '/index.html';
        }
    }

    return url;
}

function parse(rootPath, dirPath) {
    const originalPath = dirPath;
    const packageName = getPackageName(originalPath);

    let url = pathToUrl(dirPath);

    const allDetails = [];
    allDetails.push({
        name: packageName,
        type: to_dash_type('Package'),
        path: relPath(rootPath, url)
    });

    const public_types = getPublicTypes(originalPath, url);
    let type_details = undefined;
    for (public_type of public_types) {
        type_details = parseSubType(rootPath, public_type);
        for (type_detail of type_details) {
            allDetails.push(type_detail);
        }
    }

    return allDetails;
}

module.exports = {
    parse
};
