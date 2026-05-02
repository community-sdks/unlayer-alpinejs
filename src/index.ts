import UnlayerEditor, {
    type StockTemplate,
    type TemplateClient,
    type TemplatePickerOptions,
    type TemplateSearchOptions,
    type UnlayerDesign,
    type UnlayerEditorOptions,
    type UnlayerState,
    type UploadImageHandler,
} from '@community-sdks/unlayer-ts';

export type AlpineLike = {
    data(name: string, callback: (options: UnlayerAlpineOptions) => UnlayerAlpineComponent): void;
};

export type UnlayerAlpineOptions = Omit<UnlayerEditorOptions, 'onReady' | 'onChange' | 'onError'> & {
    autoMount?: boolean;
    templateSearch?: TemplateSearchOptions;
    templatePicker?: TemplatePickerOptions;
    onReady?: (editor: UnlayerEditor, component: UnlayerAlpineComponent) => void;
    onChange?: (state: UnlayerState, component: UnlayerAlpineComponent) => void;
    onError?: (error: unknown, component: UnlayerAlpineComponent) => void;
};

export type UnlayerAlpineComponent = {
    editor: UnlayerEditor | null;
    state: UnlayerState;
    ready: boolean;
    mounted: boolean;
    loading: boolean;
    error: unknown;
    templates: StockTemplate[];
    templatesOpen: boolean;
    templatesLoading: boolean;
    templateSearch: string;
    templateSearchOptions: TemplateSearchOptions;
    init(): void;
    mount(): Promise<UnlayerEditor>;
    isReady(): boolean;
    getState(): UnlayerState;
    setState(state: Partial<UnlayerState> | UnlayerDesign): void;
    loadDesign(design: UnlayerDesign, options?: { exportAfterLoad?: boolean }): void;
    exportState(): Promise<UnlayerState>;
    searchTemplates(options?: TemplateSearchOptions): Promise<StockTemplate[]>;
    refreshTemplates(): Promise<StockTemplate[]>;
    loadTemplate(slug: string): Promise<UnlayerState>;
    chooseTemplate(template: StockTemplate | string): Promise<UnlayerState>;
    openTemplates(): Promise<void>;
    closeTemplates(): void;
    setTemplateSearch(search: string): Promise<StockTemplate[]>;
    uploadImage?: UploadImageHandler;
};

export function createUnlayerAlpineComponent(options: UnlayerAlpineOptions): UnlayerAlpineComponent {
    const autoMount = options.autoMount ?? true;

    return {
        editor: null,
        state: normalizeState(options.state),
        ready: false,
        mounted: false,
        loading: false,
        error: null,
        templates: [],
        templatesOpen: false,
        templatesLoading: false,
        templateSearch: options.templateSearch?.search ?? '',
        templateSearchOptions: options.templateSearch ?? {},
        uploadImage: options.uploadImage,

        init(): void {
            if (autoMount) {
                queueMicrotask(() => {
                    this.mount().catch((error: unknown) => {
                        this.error = error;
                    });
                });
            }
        },

        async mount(): Promise<UnlayerEditor> {
            if (this.editor) {
                return this.editor;
            }

            this.loading = true;

            const editor = new UnlayerEditor({
                ...options,
                state: this.state,
                onReady: (readyEditor) => {
                    this.ready = true;
                    options.onReady?.(readyEditor, this);
                },
                onChange: (state) => {
                    this.state = state;
                    options.onChange?.(state, this);
                },
                onError: (error) => {
                    this.error = error;
                    options.onError?.(error, this);
                },
            });

            this.editor = editor;

            try {
                await editor.mount();
                this.mounted = true;

                return editor;
            } finally {
                this.loading = false;
            }
        },

        isReady(): boolean {
            return Boolean(this.editor?.isReady());
        },

        getState(): UnlayerState {
            return this.editor?.getState() ?? this.state;
        },

        setState(state: Partial<UnlayerState> | UnlayerDesign): void {
            this.state = normalizeState(state);
            this.editor?.setState(this.state);
        },

        loadDesign(design: UnlayerDesign, loadOptions: { exportAfterLoad?: boolean } = {}): void {
            this.editor?.loadDesign(design, loadOptions);
        },

        async exportState(): Promise<UnlayerState> {
            if (! this.editor) {
                return this.state;
            }

            this.state = await this.editor.exportState();

            return this.state;
        },

        async searchTemplates(searchOptions: TemplateSearchOptions = {}): Promise<StockTemplate[]> {
            const editor = await this.mount();

            this.templatesLoading = true;

            try {
                const templates = await editor.searchTemplates({
                    ...this.templateSearchOptions,
                    ...searchOptions,
                    search: searchOptions.search ?? this.templateSearch,
                });

                this.templates = templates;

                return templates;
            } finally {
                this.templatesLoading = false;
            }
        },

        async refreshTemplates(): Promise<StockTemplate[]> {
            return this.searchTemplates();
        },

        async loadTemplate(slug: string): Promise<UnlayerState> {
            const editor = await this.mount();

            this.loading = true;

            try {
                this.state = await editor.loadTemplate(slug);
                this.templatesOpen = false;

                return this.state;
            } finally {
                this.loading = false;
            }
        },

        async chooseTemplate(template: StockTemplate | string): Promise<UnlayerState> {
            return this.loadTemplate(typeof template === 'string' ? template : template.slug);
        },

        async openTemplates(): Promise<void> {
            this.templatesOpen = true;

            if (this.templates.length === 0) {
                await this.refreshTemplates();
            }
        },

        closeTemplates(): void {
            this.templatesOpen = false;
        },

        async setTemplateSearch(search: string): Promise<StockTemplate[]> {
            this.templateSearch = search;

            return this.searchTemplates({ search });
        },
    };
}

export function registerUnlayerAlpine(
    Alpine: AlpineLike,
    name: string = 'unlayerEditor',
): void {
    Alpine.data(name, createUnlayerAlpineComponent);
}

function normalizeState(state: Partial<UnlayerState> | UnlayerDesign | null | undefined): UnlayerState {
    if (! state) {
        return {
            html: '',
            design: {},
        };
    }

    if ('design' in state || 'html' in state) {
        return {
            html: typeof state.html === 'string' ? state.html : '',
            design: clone((state.design ?? {}) as UnlayerDesign),
        };
    }

    return {
        html: '',
        design: clone(state),
    };
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

export default registerUnlayerAlpine;
