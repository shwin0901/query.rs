/**
 * A HTML handler to parse attributes from meta tag
 * <meta name="rustdoc-vars"
 *       data-root-path="../"
 *       data-static-root-path="/-/rustdoc.static/"
 *       data-current-crate="opentelemetry"
 *       data-themes=""
 *       data-resource-suffix="-20240514-1.80.0-nightly-8387315ab"
 *       data-rustdoc-version="1.80.0-nightly (8387315ab 2024-05-14)"
 *       data-channel="nightly" 
 *       data-search-js="search-d52510db62a78183.js"
 *       data-settings-js="settings-4313503d2e1961c2.js">
 */
class DocsHandler {
    element(element) {
        if (element.getAttribute('name') !== 'rustdoc-vars') {
            return;
        }

        this.rootPath = element.getAttribute('data-root-path');
        this.resourceSuffix = element.getAttribute('data-resource-suffix');
        this.searchJs = element.getAttribute('data-search-js');
        this.settingsJs = element.getAttribute('data-settings-js');
    }

    searchIndexJs() {
        return `search-index${this.resourceSuffix}.js`;
    }
}

export async function onRequestGet(context) {
    let docUrl = `https://docs.rs/${context.params.crate}/${context.params.version}`;
    console.log(docUrl);

    let handler = new DocsHandler();
    let rewriter = new HTMLRewriter().on('meta', handler);

    rewriter.transform(await fetch(docUrl));
    // sleep 1 ms to wait for the rewriter to finish
    await new Promise(resolve => setTimeout(resolve, 1));

    // load search-index.js
    let searchIndexUrl = new URL(`${docUrl}/${handler.searchIndexJs()}`);
    console.log(searchIndexUrl);
    let response = await fetch(searchIndexUrl);
    let text = await response.text();
    let start = text.indexOf("parse('") + 7;
    let end = text.lastIndexOf("'));");
    let searchIndex = JSON.parse(text.substring(start, end).replace(/\\/g, ''));

    // load desc shards
    // how to know how many shards?
    return Response.json(searchIndex);
}