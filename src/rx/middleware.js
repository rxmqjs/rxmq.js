import Rx from 'rx';

class Middleware {
    constructor() {
        this.middleware = [];
        this.deletedMiddleware = [];
        this.middlewareStream = new Rx.ReplaySubject();
    }

    add({name, fn}) {
        if (!name) {
            name = 'middleware_' + this.middleware.length;
        }
        this.middleware.push({name, fn});
        this.middlewareStream.onNext({name, fn});
    }

    del({name}) {
        this.deletedMiddleware.push(name);
    }

    clear() {
        // clean subject stuff
        this.middlewareStream.dispose();
        this.middlewareStream = new Rx.ReplaySubject();
        this.middleware = [];
        this.deletedMiddleware = [];
    }

    list() {
        return this.middlewareStream.filter(({name}) => this.deletedMiddleware.indexOf(name) === -1);
    }

    transform(val) {
        return this.middlewareStream
                    .filter(({name}) => this.deletedMiddleware.indexOf(name) === -1)
                    .startWith(val)
                    .scan((acc, {fn}) => fn(acc))
                    .throttle();
    }
}

export default Middleware;
