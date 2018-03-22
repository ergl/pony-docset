const jsdom = require('jsdom')
const fs = require('fs');

function capitalize(word) {
    const [first, ...rest] = word.split('')
    return [first.toUpperCase()].concat(rest).join('')
}

function clean_name(title, cleanName) {
    return `${title.split('[', 1).join('')}.${cleanName}`
}

function clean_function_name(name) {
    return `${name.innerHTML.split('[', 1).join('')}`
}

function get_names(type, title, elt) {
    const all_siblings = []
    while (elt !== null && elt.tagName !== "H2") {
        if (elt.tagName === "H3") {
            const id = elt.getAttribute('id')
            const name = clean_function_name(elt)
            if (!name.startsWith('_')) {
                all_siblings.push({
                    id,
                    type,
                    name: clean_name(title, name)
                })
            }
        }
        elt = elt.nextElementSibling
    }

    return all_siblings
}

function public_constructors(title, document) {
    const cons = document.getElementById('constructors')
    if (cons === null) {
        return []
    }

    return get_names('Constructor', title, cons.nextElementSibling)
}

function public_behaviours(type, title, document) {
    if (type !== 'Actor') {
        return []
    }

    const be = document.getElementById('public-behaviours')
    if (be === null) {
        return []
    }

    return get_names('Method', title, be.nextElementSibling);
}

function public_functions(type, title, document) {
    const cons = document.getElementById('public-functions')
    if (cons === null) {
        return []
    }

    const dash_type = type === 'Primitive' ? 'Function' : 'Method'
    return get_names(dash_type, title, cons.nextElementSibling)

}

function parse_field(field) {
    return field.split(' ', 2)[1].split(':', 1)[0]
}

function get_field_name(title, field) {
    return `${title.split('[', 1).join('')}.${field}`
}

function gather_fields(title, elt) {
    const all_siblings = []
    while (elt !== null && elt.tagName !== "H2") {
        if (elt.tagName === "UL") {
            const field_name = parse_field(elt.children[0].textContent)
            all_siblings.push({
                id: 'public-fields',
                type: 'Field',
                name: get_field_name(title, field_name)
            })
        }

        elt = elt.nextElementSibling
    }

    return all_siblings
}

function public_fields(title, document) {
    const cons = document.getElementById('public-fields')
    if (cons !== null) {
        return gather_fields(title, cons.nextElementSibling)
    }

    return []
}

function get_file_type(document) {
    const currents = Array.from(document.getElementsByClassName('current')).filter(e => e.tagName === 'A')
    const current_a = currents.length === 1 ? currents[0] : undefined
    if (current_a) {
        return capitalize(current_a.textContent.split(' ', 1)[0])
    }

    return null
}

function get_file_title(url, type, document) {
    const raw_title_element = document.getElementsByTagName('h1')[0]
    if (raw_title_element === undefined && type === 'Package') {
        const package_name = capitalize(url.split('/')[1].split('-')[0])
        return package_name
    }

    const raw_title = raw_title_element.innerHTML
    if (type === 'Package') {
        return raw_title.split(' ', 1)[0]
    }

    return raw_title.split('[', 1)[0]
}

function to_dash_type(type) {
    if (type === "Actor") {
        return "Class"
    }

    if (type === "Primitive") {
        return "Module"
    }

    return type
}

function parse_doc(url, document) {
    const file_type = get_file_type(document);
    const title = get_file_title(url, file_type, document);
    const file_details = { name: title, type: to_dash_type(file_type), path: url }

    const constructors = public_constructors(title, document)
    const fields = public_fields(title, document)
    const behaviours = public_behaviours(file_type, title, document)
    const functions = public_functions(file_type, title, document)

    const all_functions = constructors
        .concat(fields)
        .concat(behaviours)
        .concat(functions)
        .map(elt => {
            const { type: pony_type, name, id } = elt
            const real_url = `${url}#${id}`
            return { name, type: to_dash_type(pony_type), path: real_url }
        })

    all_functions.unshift(file_details)
    return all_functions
}

function sqlite_format(line) {
    const { type, name, path } = line
    console.log(`INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES ("${name}", "${type}", "${path}");`)
}

function main(argc, argv) {
    if (argc !== 2) {
        console.error(`${argv[0]} <path>`)
        process.exit(1)
    }

    let url = argv[1]
    if (!url.endsWith('.html')) {
        if (url.endsWith('/')) {
            url = url + 'index.html'
        } else {
            url = url + '/index.html'
        }
    }

    const url_fd = fs.readFileSync(url)
    const dom = new jsdom.JSDOM(url_fd)
    const file_details = parse_doc(url, dom.window.document)
    file_details.forEach(sqlite_format)
}

const real_argv = process.argv.slice(1)
main(real_argv.length, real_argv)
