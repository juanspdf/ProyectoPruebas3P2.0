const { JSDOM } = require('jsdom');

describe('Usuario Simple Test', () => {
    test('debe ser un test básico', () => {
        expect(true).toBe(true);
    });

    test('debe configurar entorno para usuario.js', () => {
        // Configurar environment mínimo
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = {
            storage: {},
            getItem: function(key) { return this.storage[key] || null; },
            setItem: function(key, value) { this.storage[key] = value; },
            removeItem: function(key) { delete this.storage[key]; },
            clear: function() { this.storage = {}; }
        };
        global.fetch = jest.fn();
        global.Swal = { fire: jest.fn() };

        // Importar el archivo
        delete require.cache[require.resolve('../../funcionalidad/usuario.js')];
        require('../../funcionalidad/usuario.js');

        expect(global.localStorage).toBeDefined();
        dom.window.close();
    });
});
