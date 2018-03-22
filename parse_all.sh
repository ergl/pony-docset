#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
doc_path="${DIR}/docs/stdlib.ponylang.org"

should_discard() {
    local f="${1}"
    if [[ "${f}" == "css/" \
            || "${f}" == "js/" \
            || "${f}" == "search/" \
            || "${f}" == "img/"
            || "${f}" ==   "fonts/" ]]; then
        echo 1
    else
        echo 0
    fi
}

list_all_public_folders() {
    local folders=($(ls -d */ | grep --invert-match '.*-_.*'))
    for f in "${folders[@]}"; do
        local discard=$(should_discard "${f}")
        if [[ ${discard} -eq 0 ]]; then
            echo "./${f}"
        fi
    done
}

main() {
    pushd "${doc_path}"

    local public_folders=($(list_all_public_folders))

    for folder in "${public_folders[@]}"; do
        node ../../parse_single.js "${folder}"
    done

    popd
}

main "$@"
