function resolveElement(selector) {
    if (!selector) {
        return null;
    }
    return document.querySelector(selector);
}

function Router({ container, routes = {}, initial }) {
    this.container = resolveElement(container);
    this.routes = routes;
    this.current = null;
    this.navigate(initial);
}

Router.prototype.navigate = function(route) {
    if (this.current) {
        this.current.destroy();
    }

    if (!(route in this.routes)) {
        throw new Error(`Route "${route} is not defined."`);
    }
    const screen = new this.routes[route];
    const template = resolveElement(screen.template).innerHTML;
    this.container.innerHTML = template;
    screen.ready();
    this.current = screen;
};
