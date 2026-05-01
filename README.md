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

Template search and loading comes from the underlying TypeScript SDK. You can pass default filters with `templateSearch`:

```html
<div
    x-data="unlayerEditor({
        id: 'editor',
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

## Uploads

Uploads are intentionally application-owned. Provide `uploadImage(file)` and return the public URL:

```ts
uploadImage: async file => {
    return 'https://example.com/path/to/uploaded-image.png'
}
```

This package does not depend on Filament, Livewire, Vue, or React.
