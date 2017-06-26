function resolveElement(selector) {
    if (!selector) {
        return null;
    }
    return document.querySelector(selector);
}

function Router(options = {}) {
    this.container = resolveElement(options.container);
    this.routes = {};

    for (let route in options.routes || {}) {
        this.routes[route] = resolveElement(options.routes[route]);
    }

    this.navigate(options.initial);
}

Router.prototype.navigate = function(route) {
    if (!(route in this.routes)) {
        throw new Error(`Route "${route} is not defined."`);
    }
    this.container.innerHTML = this.routes[route].innerHTML;
};
