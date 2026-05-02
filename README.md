# Unofficial Unlayer Alpine.js SDK

Alpine.js adapter for [`@community-sdks/unlayer-ts`](https://www.npmjs.com/package/@community-sdks/unlayer-ts).

## Getting Started

```bash
npm install @community-sdks/unlayer-alpinejs @community-sdks/unlayer-ts alpinejs
```

## Register With Alpine

```ts
import Alpine from 'alpinejs'
import { registerUnlayerAlpine } from '@community-sdks/unlayer-alpinejs'

registerUnlayerAlpine(Alpine)

Alpine.start()
```

You can also choose a custom component name:

```ts
registerUnlayerAlpine(Alpine, 'unlayerEditor')
```

## Usage

```html
<div
    x-data="unlayerEditor({
        id: 'editor',
        displayMode: 'email',
        uploadImage: async file => {
            const data = new FormData()
            data.append('file', file)

            const response = await fetch('/your-upload-endpoint', {
                method: 'POST',
                body: data,
            })

            const body = await response.json()

            return body.url
        },
        onChange: state => {
            console.log(state.html, state.design)
        },
    })"
>
    <div id="editor" style="height: 700px"></div>

    <button type="button" x-on:click="exportState()">Export</button>
    <button type="button" x-on:click="openTemplates()">Choose template</button>

    <div x-show="templatesOpen">
        <input
            type="search"
            x-model="templateSearch"
            x-on:input.debounce.350ms="setTemplateSearch(templateSearch)"
            placeholder="Search templates"
        />

        <template x-if="templatesLoading">
            <p>Loading templates...</p>
        </template>

        <template x-for="template in templates" x-bind:key="template.slug">
            <button type="button" x-on:click="chooseTemplate(template)">
                <img x-bind:src="template.thumbnail" x-bind:alt="template.name" width="160" />
                <span x-text="template.name"></span>
            </button>
        </template>
    </div>
</div>
```

## Alpine API

The component exposes the core SDK through Alpine-friendly properties and methods:

```ts
ready
mounted
loading
error
state
templates
templatesOpen
templatesLoading
templateSearch

mount()
isReady()
getState()
setState(state)
loadDesign(design)
exportState()
searchTemplates(options)
refreshTemplates()
loadTemplate(slug)
chooseTemplate(templateOrSlug)
openTemplates()
closeTemplates()
setTemplateSearch(search)
```

## Stock Templates

Template search and loading comes from the underlying TypeScript SDK. Unlayer's public stock template search endpoint does not allow browser CORS requests, so browser apps need a backend proxy endpoint.

Register a template client that calls your own backend:

```ts
import Alpine from 'alpinejs'
import { registerUnlayerAlpine } from '@community-sdks/unlayer-alpinejs'
import { HttpTemplateClient } from '@community-sdks/unlayer-ts'

window.templateClient = new HttpTemplateClient({
    searchUrl: '/templates',
    loadUrl: '/templates/:slug',
})

registerUnlayerAlpine(Alpine)
Alpine.start()
```

Then pass that client and default filters:

```html
<div
    x-data="unlayerEditor({
        id: 'editor',
        templateClient: window.templateClient,
        templateSearch: {
            search: 'newsletter',
            type: 'email',
            premium: false,
            limit: 20,
            offset: 0,
            collection: '',
            sort: 'recent',
        },
    })"
>
    <div id="editor" style="height: 700px"></div>
</div>
```

Your backend should expose:

```txt
GET /templates
GET /templates/{slug}
```

Relative URLs call the same domain as the page. For example, `/templates` becomes `https://your-app.test/templates`.

If your template backend is on another domain, use full URLs:

```ts
window.templateClient = new HttpTemplateClient({
    searchUrl: 'https://api.example.com/templates',
    loadUrl: 'https://api.example.com/templates/:slug',
})
```

When using full URLs on another domain, that backend must allow CORS for your frontend domain.

The browser calls your backend, and your backend calls Unlayer. Using Axios instead of `fetch` does not bypass CORS because the browser enforces it before JavaScript can read the response.

## Upstream Unlayer Template API

Your backend proxy should call Unlayer's search endpoint:

```txt
POST https://unlayer.com/templates/search
Content-Type: application/json
```

Search options map to Unlayer's JSON body:

```txt
search     -> filter.name
type       -> filter.type
premium    -> filter.premium, "true" when true, "" when false
limit      -> perPage
offset     -> page, calculated as floor(offset / limit) + 1
collection -> filter.collection
sort       -> filter.sortBy
```

Example body:

```json
{
    "page": 1,
    "perPage": 20,
    "filter": {
        "premium": "",
        "collection": "",
        "name": "newsletter",
        "sortBy": "recent",
        "type": "email"
    }
}
```

Template thumbnails use `https://api.unlayer.com/v2/stock-templates/{slug}/thumbnail?width=500`.

Template designs are loaded through:

```txt
POST https://studio.unlayer.com/api/v1/graphql
```

Using `StockTemplate(slug: $slug) { StockTemplatePages { design } }`.

## Uploads

Uploads are intentionally application-owned. Provide `uploadImage(file)` and return the public URL:

```ts
uploadImage: async file => {
    return 'https://example.com/path/to/uploaded-image.png'
}
```

This package does not depend on Filament, Livewire, Vue, or React.
