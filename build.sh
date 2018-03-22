#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
docset_docs_path="${DIR}/Pony.docset/Contents/Resources/Documents/"
db_path="${DIR}/Pony.docset/Contents/Resources/docSet.dsidx"
doc_path="${DIR}/docs/stdlib.ponylang.org"

sqlite-do() {
    local db_query="${1}"
    sqlite3 "${db_path}" "${db_query}"
}

prepare_docset() {
    if [[ -d "./Pony.docset" ]]; then
        rm -rf "./Pony.docset"
    fi

    mkdir -p "./Pony.docset/Contents/Resources/Documents"
    cp "./Info.plist" "./Pony.docset/Contents/"
    touch "${db_path}"
    sqlite-do "CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT);"
    sqlite-do "CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);"
}

populate_docset() {
    while read -r line; do
        echo "${line}"
        sqlite-do "${line}"
    done < <(./parse_all.sh)
}

move-docs() {
    cp -r "${doc_path}/*" "${docset_docs_path}"
}

main() {
    prepare_docset
    populate_docset
    move-docs
}

main "$@"
